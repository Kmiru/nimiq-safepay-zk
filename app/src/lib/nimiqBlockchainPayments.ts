import { nimToLunaString } from './canonicalFields'
import { intentHashToCompactData } from './safePayIntentData'

export type SafePayBlockchainNetwork = 'testnet' | 'mainnet'

export type SafePayBlockchainPayment = {
  txHash: string
  senderAddress?: string
  recipientAddress?: string
  amountLuna?: number
  timestamp?: number
  data?: string
  raw: unknown
}

type RpcResultEnvelope<T> = {
  data?: T
  metadata?: unknown
}

type JsonRpcResponse<T> = {
  result?: T | RpcResultEnvelope<T>
  error?: {
    code?: number
    message?: string
  }
}

const DEFAULT_TESTNET_RPC_URL = 'https://rpc.testnet.nimiqwatch.com'
const DEFAULT_MAINNET_RPC_URL = 'https://rpc.nimiqwatch.com'

function getRpcUrl(network: SafePayBlockchainNetwork): string {
  if (network === 'mainnet') {
    return import.meta.env.VITE_NIMIQ_MAINNET_RPC_URL || DEFAULT_MAINNET_RPC_URL
  }

  return import.meta.env.VITE_NIMIQ_TESTNET_RPC_URL || DEFAULT_TESTNET_RPC_URL
}

function normalizeAddress(value?: string | null): string {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

function decodeHexToText(value: string): string | null {
  const cleanHex = value.startsWith('0x') ? value.slice(2) : value

  if (!/^[0-9a-fA-F]+$/.test(cleanHex) || cleanHex.length % 2 !== 0) {
    return null
  }

  try {
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
    )

    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function decodeBase64ToText(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )

    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function decodeBytesToText(value: unknown): string | null {
  if (!Array.isArray(value)) return null

  const bytes = value.filter((item): item is number => {
    return Number.isInteger(item) && item >= 0 && item <= 255
  })

  if (bytes.length !== value.length || bytes.length === 0) {
    return null
  }

  try {
    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch {
    return null
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null

  return value as Record<string, unknown>
}

function unwrapRpcResult<T>(result: JsonRpcResponse<T>['result']): T {
  const resultObject = asObject(result)

  if (resultObject && 'data' in resultObject) {
    return resultObject.data as T
  }

  return result as T
}

function unwrapTransaction(value: unknown): Record<string, unknown> | null {
  const objectValue = asObject(value)

  if (!objectValue) return null

  const nestedTransaction = asObject(objectValue.transaction)

  return nestedTransaction ?? objectValue
}

function getStringField(
  value: Record<string, unknown>,
  fieldNames: string[],
): string | undefined {
  for (const fieldName of fieldNames) {
    const fieldValue = value[fieldName]

    if (typeof fieldValue === 'string' && fieldValue.length > 0) {
      return fieldValue
    }
  }

  return undefined
}

function getNumberField(
  value: Record<string, unknown>,
  fieldNames: string[],
): number | undefined {
  for (const fieldName of fieldNames) {
    const fieldValue = value[fieldName]

    if (typeof fieldValue === 'number' && Number.isFinite(fieldValue)) {
      return fieldValue
    }

    if (typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
      const parsed = Number(fieldValue)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return undefined
}

function getTransactionTimestamp(value: Record<string, unknown>): number | undefined {
  return getNumberField(value, ['timestamp', 'blockTimestamp'])
}

function getTransactionDataCandidates(
  value: Record<string, unknown>,
): string[] {
  const candidates = new Set<string>()

  const fieldNames = [
    'data',
    'message',
    'memo',
    'extraData',
    'recipientData',
    'senderData',
  ]

  fieldNames.forEach((fieldName) => {
    const fieldValue = value[fieldName]

    if (typeof fieldValue === 'string' && fieldValue.length > 0) {
      candidates.add(fieldValue)

      const hexDecoded = decodeHexToText(fieldValue)
      if (hexDecoded) candidates.add(hexDecoded)

      const base64Decoded = decodeBase64ToText(fieldValue)
      if (base64Decoded) candidates.add(base64Decoded)
    }

    const bytesDecoded = decodeBytesToText(fieldValue)
    if (bytesDecoded) candidates.add(bytesDecoded)
  })

  return [...candidates]
}

function transactionMatches(params: {
  tx: Record<string, unknown>
  recipientAddress: string
  amountLuna: number
  expectedData: string
  minTimestampMs?: number
  maxTimestampMs?: number
}): boolean {
  const recipient = getStringField(params.tx, [
    'to',
    'recipient',
    'recipientAddress',
    'toAddress',
  ])

  const value = getNumberField(params.tx, ['value', 'amount'])
  const timestamp = getTransactionTimestamp(params.tx)
  const dataCandidates = getTransactionDataCandidates(params.tx)

  if (params.minTimestampMs !== undefined) {
    if (timestamp === undefined || timestamp < params.minTimestampMs) {
      return false
    }
  }

  if (params.maxTimestampMs !== undefined) {
    if (timestamp === undefined || timestamp > params.maxTimestampMs) {
      return false
    }
  }

  return (
    normalizeAddress(recipient) === normalizeAddress(params.recipientAddress) &&
    value === params.amountLuna &&
    dataCandidates.includes(params.expectedData)
  )
}

async function callNimiqRpc<T>(params: {
  network: SafePayBlockchainNetwork
  method: string
  params: unknown[]
}): Promise<T> {
  const response = await fetch(getRpcUrl(params.network), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: params.method,
      params: params.params,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Nimiq RPC request failed: ${response.status} ${response.statusText}`,
    )
  }

  const payload = (await response.json()) as JsonRpcResponse<T>

  if (payload.error) {
    throw new Error(
      payload.error.message || `Nimiq RPC error ${payload.error.code ?? ''}`,
    )
  }

  if (payload.result === undefined) {
    throw new Error('Nimiq RPC returned an empty result.')
  }

  return unwrapRpcResult<T>(payload.result)
}

async function getTransactionsByAddress(params: {
  network: SafePayBlockchainNetwork
  address: string
  maxTransactions: number
}): Promise<unknown[]> {
  const result = await callNimiqRpc<unknown[]>({
    network: params.network,
    method: 'getTransactionsByAddress',
    params: [
      params.address,
      params.maxTransactions,
      null,
    ],
  })

  if (!Array.isArray(result)) {
    throw new Error('Nimiq RPC returned an unexpected transaction list format.')
  }

  return result
}

export async function findSafePayPaymentOnNimiqBlockchain(params: {
  network: SafePayBlockchainNetwork
  recipientAddress: string
  amountNim: string | number
  intentHash: string | null | undefined
  maxTransactions?: number
  minTimestampMs?: number
  maxTimestampMs?: number
}): Promise<SafePayBlockchainPayment | null> {
  const amountLuna = Number(nimToLunaString(params.amountNim))

  if (!Number.isSafeInteger(amountLuna) || amountLuna <= 0) {
    throw new Error(`Invalid SafePay amount: ${params.amountNim} NIM`)
  }

  const expectedData = intentHashToCompactData(params.intentHash)

  const transactions = await getTransactionsByAddress({
    network: params.network,
    address: params.recipientAddress,
    maxTransactions: params.maxTransactions ?? 500,
  })

  for (const entry of transactions) {
    const tx = unwrapTransaction(entry)

    if (!tx) continue

    if (
      transactionMatches({
        tx,
        recipientAddress: params.recipientAddress,
        amountLuna,
        expectedData,
        minTimestampMs: params.minTimestampMs,
        maxTimestampMs: params.maxTimestampMs,
      })
    ) {
      return {
        txHash:
          getStringField(tx, ['hash', 'transactionHash', 'txHash']) ??
          getStringField(asObject(entry) ?? {}, ['hash', 'transactionHash', 'txHash']) ??
          'unknown',
        senderAddress: getStringField(tx, [
          'from',
          'sender',
          'senderAddress',
          'fromAddress',
        ]),
        recipientAddress: getStringField(tx, [
          'to',
          'recipient',
          'recipientAddress',
          'toAddress',
        ]),
        amountLuna,
        timestamp: getTransactionTimestamp(tx),
        data: expectedData,
        raw: entry,
      }
    }
  }

  return null
}
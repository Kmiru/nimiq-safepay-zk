import { useRef, useState } from 'react'
import { init } from '@nimiq/mini-app-sdk'

import {
  createInitialNimiqProviderStatus,
  type NimiqProviderStatus,
} from '../types/nimiqProviderStatus'

type NimiqProvider = Awaited<ReturnType<typeof init>>

function getProviderErrorMessage(value: unknown, fallback: string): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  ) {
    return value.error
  }

  return fallback
}

export function useNimiqProvider() {
  const providerRef = useRef<NimiqProvider | null>(null)

  const [status, setStatus] = useState<NimiqProviderStatus>(
    createInitialNimiqProviderStatus()
  )

  async function connect() {
    try {
      setStatus({
        ...createInitialNimiqProviderStatus(),
        connecting: true,
      })

      const provider = await init()
      providerRef.current = provider

      const accountsResult = await provider.listAccounts()

      if (!Array.isArray(accountsResult)) {
        throw new Error(
          getProviderErrorMessage(
            accountsResult,
            'Could not read Nimiq accounts from the provider.'
          )
        )
      }

      if (accountsResult.length === 0) {
        throw new Error(
          'No Nimiq account found. Open this app inside Nimiq Pay and connect an account.'
        )
      }

      const consensusResult = await provider.isConsensusEstablished()

      if (typeof consensusResult !== 'boolean') {
        throw new Error(
          getProviderErrorMessage(
            consensusResult,
            'Could not read Nimiq consensus status from the provider.'
          )
        )
      }

      const blockNumberResult = await provider.getBlockNumber()

      if (typeof blockNumberResult !== 'number') {
        throw new Error(
          getProviderErrorMessage(
            blockNumberResult,
            'Could not read the current Nimiq block number from the provider.'
          )
        )
      }

      setStatus({
        connecting: false,
        connected: true,
        account: accountsResult[0],
        consensusEstablished: consensusResult,
        blockNumber: blockNumberResult,
        error: null,
      })
    } catch (error) {
      console.error('Nimiq provider connection failed:', error)

      providerRef.current = null

      setStatus({
        connecting: false,
        connected: false,
        account: null,
        consensusEstablished: false,
        blockNumber: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  function disconnectLocalState() {
    providerRef.current = null
    setStatus(createInitialNimiqProviderStatus())
  }

  function getProvider() {
    return providerRef.current
  }

  return {
    ...status,
    connect,
    reconnect: connect,
    disconnectLocalState,
    getProvider,
  }
}
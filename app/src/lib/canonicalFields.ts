import { keccak256, stringToHex } from 'viem'

const FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

function bigintToFieldString(value: bigint): string {
  if (value < 0n) {
    throw new Error(`Field value cannot be negative: ${value}`)
  }

  return (value % FIELD_MODULUS).toString()
}

function parseFieldString(value: string): bigint {
  if (!value) {
    throw new Error('Field value cannot be empty')
  }

  return BigInt(value)
}

export function utf8ToFieldString(value: string): string {
  if (!value) {
    throw new Error('String value cannot be empty')
  }

  const hash = keccak256(stringToHex(value))
  return bigintToFieldString(BigInt(hash))
}

export function numberToFieldString(value: number | bigint | string): string {
  const bigintValue = BigInt(value)

  if (bigintValue < 0n) {
    throw new Error(`Number cannot be negative: ${value}`)
  }

  if (bigintValue >= FIELD_MODULUS) {
    throw new Error(`Number exceeds Field modulus: ${value}`)
  }

  return bigintValue.toString()
}

export function nimToLunaString(nimAmount: number | string): string {
  const [wholePartRaw, decimalPartRaw = ''] = String(nimAmount).split('.')

  const wholePart = wholePartRaw || '0'
  const decimalPart = decimalPartRaw.padEnd(5, '0').slice(0, 5)

  const wholeLuna = BigInt(wholePart) * 100000n
  const decimalLuna = BigInt(decimalPart || '0')

  return (wholeLuna + decimalLuna).toString()
}

export function unixTimestampToU32String(value: number | string): string {
  const timestamp = Number(value)

  if (!Number.isInteger(timestamp)) {
    throw new Error(`Invalid timestamp: ${value}`)
  }

  if (timestamp < 0 || timestamp > 4294967295) {
    throw new Error(`Timestamp out of u32 range: ${value}`)
  }

  return timestamp.toString()
}

export function assertFieldString(value: string): string {
  const parsed = parseFieldString(value)

  if (parsed < 0n) {
    throw new Error(`Field value cannot be negative: ${value}`)
  }

  if (parsed >= FIELD_MODULUS) {
    throw new Error(`Field value exceeds Field modulus: ${value}`)
  }

  return value
}

import type { HumanSafePayPayload } from './humanSafePayPayload'

export type SafePayQrPayload = {
  app: 'nimiq-safepay-zk'
  version: 1
  payload: HumanSafePayPayload
}

export function createSafePayQrPayload(
  payload: HumanSafePayPayload
): SafePayQrPayload {
  return {
    app: 'nimiq-safepay-zk',
    version: 1,
    payload,
  }
}

function base64UrlEncode(value: string): string {
  const utf8Bytes = new TextEncoder().encode(value)
  const binary = Array.from(utf8Bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('')

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(value: string): string {
  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')

  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function encodeSafePayQrPayload(payload: SafePayQrPayload): string {
  return base64UrlEncode(JSON.stringify(payload))
}

export function decodeSafePayQrPayload(encoded: string): SafePayQrPayload {
  const raw = base64UrlDecode(encoded)
  const parsed = JSON.parse(raw) as SafePayQrPayload

  if (parsed.app !== 'nimiq-safepay-zk') {
    throw new Error('Invalid SafePay QR payload app')
  }

  if (parsed.version !== 1) {
    throw new Error(`Unsupported SafePay QR payload version: ${parsed.version}`)
  }

  return parsed
}

export function createSafePayPaymentLink(
  payload: SafePayQrPayload
): string {
  const encoded = encodeSafePayQrPayload(payload)
  return `safepay-zk://pay?payload=${encoded}`
}

export function parseSafePayPaymentLink(link: string): SafePayQrPayload {
  const url = new URL(link)

  if (url.protocol !== 'safepay-zk:') {
    throw new Error(`Invalid SafePay link protocol: ${url.protocol}`)
  }

  if (url.hostname !== 'pay') {
    throw new Error(`Invalid SafePay link action: ${url.hostname}`)
  }

  const encodedPayload = url.searchParams.get('payload')

  if (!encodedPayload) {
    throw new Error('SafePay link is missing payload')
  }

  return decodeSafePayQrPayload(encodedPayload)
}

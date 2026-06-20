import type { SafePayQrPayload } from './safepayQrPayload'

export type PaymentReview = {
  recipient: string
  amountNim: string
  network: string
  nimiqNetworkId: string
  evmVerifierChainId: number
  expiresAt: number
  expiresAtLabel: string
  isExpired: boolean
}

export function buildPaymentReviewFromQrPayload(
  qrPayload: SafePayQrPayload
): PaymentReview {
  const payload = qrPayload.payload
  const nowSeconds = Math.floor(Date.now() / 1000)

  return {
    recipient: payload.recipient,
    amountNim: payload.amountNim,
    network: payload.network,
    nimiqNetworkId: payload.nimiqNetworkId,
    evmVerifierChainId: payload.evmVerifierChainId,
    expiresAt: payload.expiresAt,
    expiresAtLabel: new Date(payload.expiresAt * 1000).toLocaleString(),
    isExpired: payload.expiresAt <= nowSeconds,
  }
}

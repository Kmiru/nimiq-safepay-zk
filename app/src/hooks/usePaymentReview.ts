import { useState } from 'react'

import {
  buildPaymentReviewFromQrPayload,
  type PaymentReview,
} from '../lib/paymentReview'
import type { SafePayQrPayload } from '../lib/safepayQrPayload'
import type { ReviewStatus } from '../types/reviewStatus'

export function usePaymentReview() {
  const [paymentReview, setPaymentReview] = useState<PaymentReview | null>(null)
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('idle')
  const [reviewError, setReviewError] = useState<string | null>(null)

  function resetPaymentReview() {
    setPaymentReview(null)
    setReviewStatus('idle')
    setReviewError(null)
  }

  function resetReviewVerificationState() {
    setReviewStatus('idle')
    setReviewError(null)
  }

  function handleParseSuccess(parsed: SafePayQrPayload) {
    setPaymentReview(buildPaymentReviewFromQrPayload(parsed))
    setReviewStatus('idle')
    setReviewError(null)
  }

  function handleParseError(error: unknown) {
    setPaymentReview(null)
    setReviewStatus('idle')
    setReviewError(error instanceof Error ? error.message : String(error))
  }

  function markReviewVerifying() {
    setReviewStatus('verifying')
    setReviewError(null)
  }

  function markReviewVerified() {
    setReviewStatus('verified')
    setReviewError(null)
  }

  function markReviewFailed(error: unknown) {
    setReviewStatus('failed')
    setReviewError(error instanceof Error ? error.message : String(error))
  }

  return {
    paymentReview,
    reviewStatus,
    reviewError,
    setReviewStatus,
    setReviewError,
    resetPaymentReview,
    resetReviewVerificationState,
    handleParseSuccess,
    handleParseError,
    markReviewVerifying,
    markReviewVerified,
    markReviewFailed,
  }
}
import type { RefObject } from 'react'
import type { PaymentReview } from '../lib/paymentReview'
import type { ReviewStatus } from '../types/reviewStatus'

type PaymentReviewCardProps = {
  paymentReview: PaymentReview
  reviewStatus: ReviewStatus
  reviewError: string | null
  paymentReviewRef: RefObject<HTMLElement | null>
  onVerifyBeforePayment: () => void
  onResetFlow: () => void
}

function getReviewStatusLabel(
  paymentReview: PaymentReview,
  reviewStatus: ReviewStatus
) {
  if (reviewStatus === 'verified') {
    return 'Payment request verified'
  }

  if (reviewStatus === 'failed') {
    return 'Verification failed'
  }

  if (reviewStatus === 'verifying') {
    return 'Verifying request...'
  }

  if (paymentReview.isExpired) {
    return 'Payment request expired'
  }

  return 'Ready to verify'
}

function getReviewStatusClass(
  paymentReview: PaymentReview,
  reviewStatus: ReviewStatus
) {
  if (reviewStatus === 'verified') {
    return 'success'
  }

  if (reviewStatus === 'failed' || paymentReview.isExpired) {
    return 'error'
  }

  if (reviewStatus === 'verifying') {
    return 'warning'
  }

  return 'ready'
}

function getVerifyButtonLabel(reviewStatus: ReviewStatus) {
  if (reviewStatus === 'verifying') {
    return 'Verifying...'
  }

  if (reviewStatus === 'verified') {
    return 'Verified'
  }

  return 'Verify Before Payment'
}

export function PaymentReviewCard({
  paymentReview,
  reviewStatus,
  reviewError,
  paymentReviewRef,
  onVerifyBeforePayment,
  onResetFlow,
}: PaymentReviewCardProps) {
  const statusClass = getReviewStatusClass(paymentReview, reviewStatus)
  const verifyButtonLabel = getVerifyButtonLabel(reviewStatus)

  const canVerify =
    !paymentReview.isExpired &&
    reviewStatus !== 'verifying' &&
    reviewStatus !== 'verified'

  return (
    <section className="card payment-review-card" ref={paymentReviewRef}>
      <div className="review-card-header">
        <div>
          <div className="section-eyebrow">Payment review</div>

          <h2 className="card-title">Confirm before you pay</h2>

          <p className="card-subtitle">
            Review the amount, recipient, network, and expiration before running
            SafePay verification.
          </p>
        </div>

        <div className={`review-status-pill ${statusClass}`}>
          {getReviewStatusLabel(paymentReview, reviewStatus)}
        </div>
      </div>

      <div className="payment-summary-panel">
        <span className="payment-summary-label">Amount</span>
        <strong className="payment-summary-amount">
          {paymentReview.amountNim} NIM
        </strong>
        <span className="payment-summary-network">
          {paymentReview.network}
        </span>
      </div>

      <div className="recipient-summary-panel">
        <span className="recipient-summary-label">Recipient</span>
        <strong className="recipient-summary-address">
          {paymentReview.recipient}
        </strong>
      </div>

      <div className="review-details-title">Request details</div>

      <div className="detail-table review-detail-table">
        <div className="detail-row">
          <span className="detail-label">Nimiq Network</span>
          <span className="detail-value">{paymentReview.nimiqNetworkId}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">EVM Verifier Chain</span>
          <span className="detail-value">
            {paymentReview.evmVerifierChainId}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Expires</span>
          <span className="detail-value">{paymentReview.expiresAtLabel}</span>
        </div>
      </div>

      {reviewError && <div className="error-block">{reviewError}</div>}

      <div className="review-action-area">
        <button
          className={`btn ${
            reviewStatus === 'verified'
              ? 'btn-success'
              : reviewStatus === 'verifying'
                ? 'btn-warning'
                : 'btn-primary'
          }`}
          onClick={onVerifyBeforePayment}
          disabled={!canVerify}
        >
          {verifyButtonLabel}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={onResetFlow}
        >
          ← Scan Another Payment
        </button>
      </div>
    </section>
  )
}
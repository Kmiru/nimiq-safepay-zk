import type { PaymentReview } from '../lib/paymentReview'
import type { NimiqPaymentStatus } from '../types/nimiqPaymentStatus'

type NimiqPaymentCardProps = {
  paymentReview: PaymentReview
  nimiqConnected: boolean
  privateIntentVerified: boolean
  paymentStatus: NimiqPaymentStatus
  onSendPayment: () => void
}

export function NimiqPaymentCard({
  paymentReview,
  nimiqConnected,
  privateIntentVerified,
  paymentStatus,
  onSendPayment,
}: NimiqPaymentCardProps) {
  const canSendPayment =
    nimiqConnected &&
    privateIntentVerified &&
    !paymentReview.isExpired &&
    !paymentStatus.sending &&
    !paymentStatus.sent

  const readyToPay =
    nimiqConnected &&
    privateIntentVerified &&
    !paymentReview.isExpired &&
    !paymentStatus.sent

  return (
    <section className={`card nimiq-payment-card ${paymentStatus.sent ? 'sent' : ''}`}>
      <div className="payment-final-header">
        <div className="payment-final-icon">
          {paymentStatus.sent ? '✓' : '◇'}
        </div>

        <div>
          <div className="section-eyebrow">
            Final step
          </div>

          <h2 className="card-title">
            {paymentStatus.sent ? 'Payment Sent' : 'Ready to Pay'}
          </h2>

          <p className="card-subtitle">
            {paymentStatus.sent
              ? 'The payment was sent through Nimiq Pay.'
              : 'SafePay verified the request. You can now continue with Nimiq Pay.'}
          </p>
        </div>
      </div>

      <div className="pay-summary-panel">
        <span className="pay-summary-label">Amount</span>
        <strong className="pay-summary-amount">
          {paymentReview.amountNim} NIM
        </strong>
        <span className="pay-summary-recipient">
          To {paymentReview.recipient}
        </span>
      </div>

      <div className="payment-readiness-grid">
        <div className={`payment-readiness-item ${nimiqConnected ? 'success' : 'pending'}`}>
          <span>{nimiqConnected ? '✓' : '!'}</span>
          <div>
            <strong>Nimiq Pay</strong>
            <small>{nimiqConnected ? 'Connected' : 'Connect before payment'}</small>
          </div>
        </div>

        <div className={`payment-readiness-item ${privateIntentVerified ? 'success' : 'pending'}`}>
          <span>{privateIntentVerified ? '✓' : '!'}</span>
          <div>
            <strong>SafePay check</strong>
            <small>{privateIntentVerified ? 'Verified' : 'Verification required'}</small>
          </div>
        </div>
      </div>

      <button
        className={`btn payment-main-button ${
          paymentStatus.sent
            ? 'btn-success'
            : readyToPay
              ? 'btn-primary'
              : 'btn-ghost'
        }`}
        onClick={onSendPayment}
        disabled={!canSendPayment}
      >
        {paymentStatus.sending
          ? 'Opening Nimiq Pay...'
          : paymentStatus.sent
            ? 'Payment Sent'
            : 'Pay with Nimiq'}
      </button>

      {!nimiqConnected && (
        <div className="info-block">
          Connect Nimiq Pay before sending the payment.
        </div>
      )}

      {!privateIntentVerified && (
        <div className="info-block">
          Verify the payment request before sending funds.
        </div>
      )}

      {paymentStatus.transactionHash && (
        <div className="transaction-result-block">
          <span className="transaction-result-label">Transaction hash</span>
          <pre className="code-block">{paymentStatus.transactionHash}</pre>
        </div>
      )}

      {paymentStatus.error && (
        <div className="error-block">{paymentStatus.error}</div>
      )}
    </section>
  )
}
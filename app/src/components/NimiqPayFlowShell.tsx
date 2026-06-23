import { useEffect, useRef, useState, type RefObject } from 'react'
import '../styles/nimiqPayFlow.css'
import {
  clearSafePayActivity,
  getSafePayActivity,
  saveSafePayActivity,
  shortRecipient,
  shortValue,
  updateSafePayActivityPayment,
  type SafePayActivityItem,
} from '../lib/safePayActivity'

type PayScreen = 'scan' | 'manual' | 'preview' | 'sent'
type ReviewStatus = 'idle' | 'verifying' | 'verified' | 'failed'

type PaymentReviewLike = {
  amountNim: string | number
  recipient: string
  network?: string
  expiresAtLabel?: string
  memoPublic?: string
  intentHash?: string
  nullifier?: string
  isExpired?: boolean
}

type PaymentStatusLike = {
  sending?: boolean
  sent?: boolean
  error?: string | null
  txHash?: string | null
  transactionHash?: string | null
}

type NimiqPayFlowShellProps = {
  manualPaymentLink: string
  scannerRunning: boolean
  scannerError: string | null
  videoRef: RefObject<HTMLVideoElement | null>

  paymentReview: PaymentReviewLike | null
  reviewStatus: ReviewStatus
  reviewError: string | null
  proofPublicInputs: string[]

  nimiqConnected: boolean
  nimiqConnecting: boolean
  paymentStatus: PaymentStatusLike

  onManualPaymentLinkChange: (value: string) => void
  onParsePaymentLink: () => void
  onLoadDemoPaymentForPreview: () => void
  onStartQrScanner: () => void
  onStopQrScanner: () => void
  onVerifyBeforePayment: () => void
  onSendPayment: () => void
  onConnectNimiq: () => void
  onResetFlow: () => void
}

function shortenAddress(address: string) {
  return shortRecipient(address)
}

function shortHash(value?: string) {
  return shortValue(value) ?? '—'
}

function getVerificationTitle(reviewStatus: ReviewStatus) {
  if (reviewStatus === 'verified') return 'SafePay verified'
  if (reviewStatus === 'verifying') return 'Checking request...'
  if (reviewStatus === 'failed') return 'Payment blocked'
  return 'Preparing verification...'
}

function getVerificationDescription(reviewStatus: ReviewStatus) {
  if (reviewStatus === 'verified') {
    return 'The recipient, amount, network, and payment intent match this request.'
  }

  if (reviewStatus === 'verifying') {
    return 'Generating private proof and verifying the payment intent.'
  }

  if (reviewStatus === 'failed') {
    return 'This request could not be verified. Do not continue with this payment.'
  }

  return 'SafePay will verify this request before enabling payment.'
}

export function NimiqPayFlowShell({
  manualPaymentLink,
  scannerRunning,
  scannerError,
  videoRef,

  paymentReview,
  reviewStatus,
  reviewError,
  proofPublicInputs,

  nimiqConnected,
  nimiqConnecting,
  paymentStatus,

  onManualPaymentLinkChange,
  onParsePaymentLink,
  onLoadDemoPaymentForPreview,
  onStartQrScanner,
  onStopQrScanner,
  onVerifyBeforePayment,
  onSendPayment,
  onConnectNimiq,
  onResetFlow,
}: NimiqPayFlowShellProps) {
  const [screen, setScreen] = useState<PayScreen>('scan')
  const [autoVerifyStarted, setAutoVerifyStarted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [returningToNimiqPay, setReturningToNimiqPay] = useState(false)
  const autoVerifyLockRef = useRef(false)
  const [showActivity, setShowActivity] = useState(false)
  const [activityItems, setActivityItems] = useState<SafePayActivityItem[]>(() =>
    getSafePayActivity(),
  )
  const [lastActivityId, setLastActivityId] = useState<string | null>(null)

  const amount = paymentReview
    ? Number(paymentReview.amountNim).toFixed(2)
    : '0.00'

  const txHash = paymentStatus.txHash ?? paymentStatus.transactionHash ?? null
  const intentHash =
    paymentReview?.intentHash ??
    proofPublicInputs[0] ??
    null

  const nullifier =
    paymentReview?.nullifier ??
    proofPublicInputs[1] ??
    null

  const canPay =
    !!paymentReview &&
    reviewStatus === 'verified' &&
    nimiqConnected &&
    !paymentReview.isExpired &&
    !paymentStatus.sending &&
    !paymentStatus.sent

  const walletStatusLabel = nimiqConnected
    ? 'Connected to Nimiq Pay'
    : nimiqConnecting
      ? 'Connecting to Nimiq Pay...'
      : 'Connect with Nimiq Pay'

  useEffect(() => {
    if (paymentReview) {
      setScreen('preview')
    }
  }, [paymentReview])

  useEffect(() => {
    if (!paymentReview) {
      setAutoVerifyStarted(false)
      setShowDetails(false)
      autoVerifyLockRef.current = false
    }
  }, [paymentReview])

  useEffect(() => {
    if (
      screen !== 'preview' ||
      !paymentReview ||
      reviewStatus !== 'idle' ||
      autoVerifyLockRef.current
    ) {
      return
    }

    autoVerifyLockRef.current = true
    setAutoVerifyStarted(true)

    window.setTimeout(() => {
      onVerifyBeforePayment()
    }, 450)
  }, [screen, paymentReview, reviewStatus, onVerifyBeforePayment])

  useEffect(() => {
    if (!paymentStatus.sent) return

    setScreen('sent')
    setReturningToNimiqPay(true)

    const timer = window.setTimeout(() => {
      closeFlow()
    }, 1500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [paymentStatus.sent])

  useEffect(() => {
    if (!paymentReview || reviewStatus !== 'verified') return

    const id =
      intentHash ??
      `${paymentReview.recipient}-${paymentReview.amountNim}-${Date.now()}`

    const item: SafePayActivityItem = {
      id,
      createdAt: new Date().toISOString(),
      amountNim: Number(paymentReview.amountNim).toFixed(2),
      recipientShort: shortRecipient(paymentReview.recipient),
      network: paymentReview.network ?? 'Nimiq',
      verificationStatus: 'verified',
      paymentStatus: 'not_paid',
      intentHashShort: shortValue(intentHash),
    }

    saveSafePayActivity(item)
    setActivityItems(getSafePayActivity())
    setLastActivityId(id)
  }, [paymentReview, reviewStatus])

  useEffect(() => {
    if (!paymentStatus.sent || !lastActivityId) return

    updateSafePayActivityPayment(lastActivityId, shortValue(txHash))
    setActivityItems(getSafePayActivity())
  }, [paymentStatus.sent, lastActivityId, txHash])

  function closeFlow() {
    setScreen('scan')
    setAutoVerifyStarted(false)
    setShowDetails(false)
    setShowActivity(false)
    setReturningToNimiqPay(false)
    autoVerifyLockRef.current = false
    onResetFlow()
  }

  function goBack() {
    if (screen === 'manual') {
      setScreen('scan')
      return
    }

    if (screen === 'preview') {
      setScreen('scan')
      setAutoVerifyStarted(false)
      setShowDetails(false)
      autoVerifyLockRef.current = false
      onResetFlow()
    }
  }

  function handleManualContinue() {
    onParsePaymentLink()
  }

  function handleMainAction() {
    if (!paymentReview) return

    if (!nimiqConnected) {
      onConnectNimiq()
      return
    }

    if (reviewStatus === 'verified') {
      onSendPayment()
    }
  }

  function getMainButtonLabel() {
    if (paymentStatus.sending) return 'Opening Nimiq Pay...'
    if (paymentStatus.sent) return 'Payment Sent'
    if (!paymentReview) return 'PAY'
    if (reviewStatus === 'verifying') return 'Verifying...'
    if (reviewStatus === 'failed') return 'Payment blocked'
    if (reviewStatus !== 'verified') return 'Verifying...'
    if (!nimiqConnected) return nimiqConnecting ? 'Connecting...' : 'Connect Nimiq Pay'
    return 'PAY'
  }

  return (
    <main className="nq-pay-shell">
      <div
        className="nq-pay-slider"
        style={{
          transform:
            screen === 'scan'
              ? 'translateX(0)'
              : screen === 'manual'
                ? 'translateX(-100vw)'
                : screen === 'preview'
                  ? 'translateX(-200vw)'
                  : 'translateX(-300vw)',
        }}
      >
        <section className="nq-pay-screen">
          <button className="nq-close-btn" onClick={closeFlow}>
            ×
          </button>

          <div className="nq-screen-content nq-scan-content">
            <h1 className="nq-screen-title">Scan QR Code</h1>
            <p className="nq-screen-subtitle">Scan a SafePay payment request</p>
            <button
              className={`nq-wallet-status ${nimiqConnected ? 'connected' : ''}`}
              onClick={onConnectNimiq}
              disabled={nimiqConnected || nimiqConnecting}
            >
              <span className="nq-wallet-dot" />
              {walletStatusLabel}
            </button>

            <div className={`nq-qr-frame ${scannerRunning ? 'active' : ''}`}>
              <div className="nq-qr-corners">
                {!scannerRunning && (
                  <div className="nq-qr-placeholder">
                    <span>QR</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  className={`nq-video-preview ${scannerRunning ? 'active' : ''}`}
                  autoPlay
                  muted
                  playsInline
                />
              </div>
            </div>

            {!scannerRunning ? (
              <button className="nq-primary-mini-btn" onClick={onStartQrScanner}>
                Scan QR Code
              </button>
            ) : (
              <button className="nq-primary-mini-btn" onClick={onStopQrScanner}>
                Stop scanner
              </button>
            )}

            <button className="nq-link-btn" onClick={() => setScreen('manual')}>
              Enter manually
            </button>

            <button className="nq-dev-demo-btn" onClick={onLoadDemoPaymentForPreview}>
              Use demo request
            </button>

            <button
              className="nq-activity-link"
              onClick={() => {
                setActivityItems(getSafePayActivity())
                setShowActivity(true)
              }}
            >
              SafePay activity
            </button>

            {scannerError && <div className="nq-error-text">{scannerError}</div>}
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <h1 className="nq-header-title">Enter payment request</h1>

          <div className="nq-screen-content nq-manual-content">
            <textarea
              className="nq-request-input"
              placeholder="Paste or type the invoice here"
              value={manualPaymentLink}
              onChange={(event) => onManualPaymentLinkChange(event.target.value)}
            />

            <button
              className="nq-primary-btn"
              onClick={handleManualContinue}
              disabled={!manualPaymentLink.trim()}
            >
              Continue
            </button>

            {reviewError && <div className="nq-error-text">{reviewError}</div>}
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <h1 className="nq-header-title">Payment preview</h1>

          <div className="nq-screen-content nq-preview-content">
            <div className="nq-amount-block">
              <div className="nq-amount">{amount}</div>
              <div className="nq-currency">NIM</div>
            </div>

            <div className={`nq-wallet-preview ${nimiqConnected ? 'connected' : ''}`}>
              <span className="nq-wallet-dot" />
              <strong>{walletStatusLabel}</strong>
            </div>

            <div className={`nq-safepay-status status-${reviewStatus}`}>
              <div className="nq-safepay-icon">
                {reviewStatus === 'verified'
                  ? '✓'
                  : reviewStatus === 'failed'
                    ? '!'
                    : '…'}
              </div>

              <div>
                <strong>{getVerificationTitle(reviewStatus)}</strong>
                <span>{getVerificationDescription(reviewStatus)}</span>
              </div>
            </div>

            <div className="nq-preview-card">
              <div className="nq-preview-row">
                <span>Recipient</span>
                <strong>
                  {paymentReview
                    ? shortenAddress(paymentReview.recipient)
                    : 'Not loaded'}
                </strong>
              </div>

              <div className="nq-preview-row">
                <span>Request</span>
                <strong>{paymentReview?.memoPublic ?? 'SafePay request'}</strong>
              </div>

              <div className="nq-preview-row">
                <span>Network</span>
                <strong>{paymentReview?.network ?? 'Nimiq'}</strong>
              </div>

              <div className="nq-preview-row">
                <span>Expires</span>
                <strong>{paymentReview?.expiresAtLabel ?? '—'}</strong>
              </div>
            </div>

            <button
              className="nq-details-toggle"
              onClick={() => setShowDetails((value) => !value)}
            >
              {showDetails ? 'Hide technical details' : 'View technical details'}
            </button>

            {showDetails && (
              <div className="nq-technical-card">
                <div className="nq-preview-row">
                  <span>Proof status</span>
                  <strong>{reviewStatus === 'verified' ? 'Valid' : reviewStatus}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Intent hash</span>
                  <strong>{shortHash(intentHash ?? undefined)}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Nullifier</span>
                  <strong>{shortHash(nullifier ?? undefined)}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Verifier</span>
                  <strong>{reviewStatus === 'verified' ? 'Passed' : 'Pending'}</strong>
                </div>
              </div>
            )}

            {reviewError && <div className="nq-error-text">{reviewError}</div>}
          </div>

          <div className="nq-bottom-action">
            <button
              className="nq-pay-btn"
              onClick={handleMainAction}
              disabled={
                !paymentReview ||
                paymentStatus.sending ||
                paymentStatus.sent ||
                reviewStatus === 'verifying' ||
                reviewStatus === 'failed' ||
                reviewStatus !== 'verified' ||
                (reviewStatus === 'verified' && !canPay && nimiqConnected)
              }
            >
              {getMainButtonLabel()}
            </button>
          </div>
        </section>

        <section className="nq-pay-screen">
          <div className="nq-screen-content nq-sent-content">
            <div className="nq-sent-icon">✓</div>
            <h1 className="nq-screen-title">Payment sent</h1>
            <p className="nq-screen-subtitle">
              {returningToNimiqPay
                ? 'Returning to Nimiq Pay...'
                : 'SafePay verification completed.'}
            </p>

            {txHash && (
              <div className="nq-sent-hash">
                <span>Transaction</span>
                <code>{shortHash(txHash)}</code>
              </div>
            )}

            <button className="nq-link-btn" onClick={closeFlow}>
              Back to SafePay
            </button>
          </div>
        </section>
      </div>
      {showActivity && (
        <div className="nq-activity-overlay">
          <div className="nq-activity-sheet">
            <div className="nq-activity-header">
              <div>
                <h2>SafePay activity</h2>
                <p>Local verification history only.</p>
              </div>

              <button
                className="nq-activity-close"
                onClick={() => setShowActivity(false)}
              >
                ×
              </button>
            </div>

            {activityItems.length === 0 ? (
              <div className="nq-empty-activity">
                No SafePay verifications yet.
              </div>
            ) : (
              <div className="nq-activity-list">
                {activityItems.map((item) => (
                  <div className="nq-activity-item" key={item.id}>
                    <div className="nq-activity-main">
                      <strong>{item.amountNim} NIM</strong>
                      <span>{item.recipientShort}</span>
                    </div>

                    <div className="nq-activity-meta">
                      <span>Verification: {item.verificationStatus}</span>
                      <span>Payment: {item.paymentStatus}</span>
                      {item.intentHashShort && (
                        <span>Intent: {item.intentHashShort}</span>
                      )}
                      {item.txHashShort && <span>Tx: {item.txHashShort}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activityItems.length > 0 && (
              <button
                className="nq-clear-activity"
                onClick={() => {
                  clearSafePayActivity()
                  setActivityItems([])
                  setLastActivityId(null)
                }}
              >
                Clear activity
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
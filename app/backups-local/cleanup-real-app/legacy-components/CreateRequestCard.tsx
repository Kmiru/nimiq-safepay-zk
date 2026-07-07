import { useState } from 'react'

type CreateRequestCardProps = {
  qrDataUrl: string | null
  requestLink: string | null
  error: string | null
  onCreateRequest: () => void
  onLoadRequestForReview: () => void
}

export function CreateRequestCard({
  qrDataUrl,
  requestLink,
  error,
  onCreateRequest,
  onLoadRequestForReview,
}: CreateRequestCardProps) {
  const [showQrFullscreen, setShowQrFullscreen] = useState(false)

  return (
    <section className="card create-request-card">
      <div className="create-request-top">
        <div className="create-request-icon">QR</div>

        <div className="create-request-main">
          <div className="create-request-title-row">
            <div>
              <p className="section-eyebrow">Receiver mode</p>
              <h2 className="create-request-title">Create SafePay Request</h2>
            </div>

            <span className="create-request-badge">Demo</span>
          </div>

          <p className="create-request-description">
            Generate a SafePay QR that another user can scan and verify before
            paying.
          </p>

          <div className="create-request-summary">
            <div>
              <span>Amount</span>
              <strong>25 NIM</strong>
            </div>

            <div>
              <span>Network</span>
              <strong>Nimiq Testnet</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>SafePay request</strong>
            </div>
          </div>

          <div className="create-request-actions">
            <button className="btn btn-primary btn-sm" onClick={onCreateRequest}>
              Generate QR
            </button>

            {requestLink && (
              <button
                className="btn btn-outline btn-sm"
                onClick={onLoadRequestForReview}
              >
                Review This Request
              </button>
            )}
          </div>
        </div>
      </div>

      {qrDataUrl && (
        <div className="create-request-qr-panel create-request-qr-panel-large">
          <button
            className="create-request-qr-touch-target"
            type="button"
            onClick={() => setShowQrFullscreen(true)}
            aria-label="Open generated SafePay QR full screen"
          >
            <img
              className="create-request-qr-image create-request-qr-image-large"
              src={qrDataUrl}
              alt="Generated SafePay request QR"
              width={360}
              height={360}
            />
          </button>

          <button
            className="btn btn-primary btn-sm create-request-fullscreen-btn"
            type="button"
            onClick={() => setShowQrFullscreen(true)}
          >
            View QR full screen
          </button>

          <div className="create-request-qr-info">
            <strong>SafePay QR ready</strong>
            <span>Scan this QR from another device using SafePay ZK.</span>
          </div>
        </div>
      )}

      {showQrFullscreen && qrDataUrl && (
        <div className="create-request-qr-fullscreen-overlay">
          <div className="create-request-qr-fullscreen-sheet">
            <button
              className="create-request-qr-fullscreen-close"
              type="button"
              aria-label="Close full screen QR"
              title="Close QR"
              onClick={() => setShowQrFullscreen(false)}
            >
              ×
            </button>

            <div className="create-request-qr-fullscreen-header">
              <span>SafePay request QR</span>
              <strong>Scan to verify and pay</strong>
            </div>

            <img
              src={qrDataUrl}
              alt="SafePay request QR full screen"
              className="create-request-qr-fullscreen-image"
            />

            <p className="create-request-qr-fullscreen-note">
              Ask the customer to scan this QR with SafePay ZK.
            </p>
          </div>
        </div>
      )}

      {requestLink && (
        <details className="created-link-details">
          <summary>View request link</summary>
          <code>{requestLink}</code>
        </details>
      )}

      {error && <div className="error-block">{error}</div>}
    </section>
  )
}
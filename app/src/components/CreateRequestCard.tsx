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
  return (
    <section className="card create-request-card">
      <div className="create-request-header">
        <div>
          <p className="section-eyebrow">Create request</p>
          <h2 className="card-title">Generate a SafePay QR</h2>
          <p className="card-subtitle">
            Create a verified payment request that another user can scan before
            paying.
          </p>
        </div>

        <div className="create-request-badge">Receiver</div>
      </div>

      <div className="create-request-preview">
        <div className="create-request-row">
          <span>Amount</span>
          <strong>25 NIM</strong>
        </div>

        <div className="create-request-row">
          <span>Network</span>
          <strong>Nimiq Testnet</strong>
        </div>

        <div className="create-request-row">
          <span>Status</span>
          <strong>Demo SafePay request</strong>
        </div>
      </div>

      <div className="create-request-actions">
        <button className="btn btn-primary" onClick={onCreateRequest}>
          Generate SafePay QR
        </button>

        {requestLink && (
          <button className="btn btn-outline btn-sm" onClick={onLoadRequestForReview}>
            Review This Request
          </button>
        )}
      </div>

      {qrDataUrl && (
        <div className="create-request-qr-panel">
          <img
            className="qr-image"
            src={qrDataUrl}
            alt="Generated SafePay request QR"
            width={320}
            height={320}
          />

          <p className="create-request-note">
            Scan this QR from another device using SafePay ZK.
          </p>
        </div>
      )}

      {requestLink && (
        <div className="created-link-box">
          <span>SafePay request link</span>
          <code>{requestLink}</code>
        </div>
      )}

      {error && <div className="error-block">{error}</div>}
    </section>
  )
}

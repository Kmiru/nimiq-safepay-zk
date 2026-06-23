import type { RefObject } from 'react'

type ScanPaymentCardProps = {
  manualPaymentLink: string
  scannerRunning: boolean
  scannerError: string | null
  qrDataUrl: string | null
  qrError: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  qrPreviewRef: RefObject<HTMLDivElement | null>
  onManualPaymentLinkChange: (value: string) => void
  onParsePaymentLink: () => void
  onLoadDemoPaymentLink: () => void
  onStartQrScanner: () => void
  onStopQrScanner: () => void
  onGenerateDemoQr: () => void
}

export function ScanPaymentCard({
  manualPaymentLink,
  scannerRunning,
  scannerError,
  videoRef,
  onManualPaymentLinkChange,
  onParsePaymentLink,
  onLoadDemoPaymentLink,
  onStartQrScanner,
  onStopQrScanner,
}: ScanPaymentCardProps) {
  const hasPaymentLink = manualPaymentLink.trim().length > 0

  return (
    <section className="card scan-payment-card">
      <div className="scan-card-header">
        <div>
          <p className="section-eyebrow">Payer mode</p>
          <h2 className="card-title">Scan or verify a request</h2>
          <p className="card-subtitle">
            Review a SafePay request before sending funds with Nimiq Pay.
          </p>
        </div>
      </div>

      <div className="manual-link-panel">
        <label className="input-label" htmlFor="manualPaymentLink">
          SafePay request link
        </label>

        <textarea
          id="manualPaymentLink"
          className="payment-link-input"
          value={manualPaymentLink}
          onChange={(event) => onManualPaymentLinkChange(event.target.value)}
          placeholder="Paste a SafePay link here..."
          rows={2}
        />

        <div className="scan-action-row">
          <button
            className="btn btn-primary"
            onClick={onParsePaymentLink}
            disabled={!hasPaymentLink}
          >
            Review Payment
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={onLoadDemoPaymentLink}
          >
            Load Demo
          </button>

          {!scannerRunning ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={onStartQrScanner}
            >
              Scan QR Code
            </button>
          ) : (
            <button
              className="btn btn-outline btn-sm"
              onClick={onStopQrScanner}
            >
              Stop Scanner
            </button>
          )}
        </div>
      </div>

      <div className={`scanner-preview-panel ${scannerRunning ? 'active' : ''}`}>
        <div className="scanner-preview-header">
          <span>QR Scanner Active</span>
          <small>Point the camera at a SafePay QR code</small>
        </div>

        <video
          ref={videoRef}
          className="video-preview"
          autoPlay
          muted
          playsInline
        />
      </div>

      {scannerError && <div className="error-block">{scannerError}</div>}
    </section>
  )
}
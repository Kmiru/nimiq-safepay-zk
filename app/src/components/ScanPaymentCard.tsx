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
  qrDataUrl,
  qrError,
  videoRef,
  qrPreviewRef,
  onManualPaymentLinkChange,
  onParsePaymentLink,
  onLoadDemoPaymentLink,
  onStartQrScanner,
  onStopQrScanner,
  onGenerateDemoQr,
}: ScanPaymentCardProps) {
  const hasPaymentLink = manualPaymentLink.trim().length > 0

  return (
    <section className="card">
      <h2 className="card-title">Review a SafePay Request</h2>

      <p className="card-subtitle">
        Paste a SafePay link or scan a QR code. SafePay will show the payment
        details before you send funds.
      </p>

      <div className="scan-clean-section">
        <textarea
          className="textarea-field"
          value={manualPaymentLink}
          onChange={(event) => onManualPaymentLinkChange(event.target.value)}
          placeholder="Paste a SafePay link here..."
          rows={2}
        />

        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={onParsePaymentLink}
            disabled={!hasPaymentLink}
          >
            Review Payment
          </button>

          <div className="btn-row">
            <button
              className="btn btn-outline btn-sm"
              onClick={onLoadDemoPaymentLink}
            >
              Load Demo
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={onGenerateDemoQr}
            >
              Show QR
            </button>
          </div>

          {!scannerRunning ? (
            <button className="btn btn-dark btn-sm" onClick={onStartQrScanner}>
              Scan QR Code
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={onStopQrScanner}>
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

      <p className={`scanner-status ${scannerRunning ? 'active' : ''}`}>
        Scanner: {scannerRunning ? 'active' : 'off'}
      </p>

      {scannerError && <div className="error-block">{scannerError}</div>}

      {qrDataUrl && (
        <div ref={qrPreviewRef} className="qr-preview-panel">
          <img
            className="qr-image"
            src={qrDataUrl}
            alt="Demo SafePay QR"
            width={320}
            height={320}
          />
        </div>
      )}

      {qrError && <div className="error-block">{qrError}</div>}
    </section>
  )
}
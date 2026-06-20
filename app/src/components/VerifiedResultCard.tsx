import type { RefObject } from 'react'

type VerifiedResultCardProps = {
  verifiedResultRef: RefObject<HTMLElement | null>
  browserProofVerified: boolean
  evmVerified: boolean | null
  proofSize: number | null
  onResetFlow: () => void
}

function getVerifierLabel(value: boolean | null) {
  if (value === null) return 'Pending'
  return value ? 'Verified' : 'Failed'
}

function getVerifierClass(value: boolean | null) {
  if (value === null) return 'pending'
  return value ? 'success' : 'error'
}

export function VerifiedResultCard({
  verifiedResultRef,
  browserProofVerified,
  evmVerified,
  proofSize,
  onResetFlow,
}: VerifiedResultCardProps) {
  return (
    <section className="card verified-result-card" ref={verifiedResultRef}>
      <div className="verified-hero">
        <div className="verified-icon-large">✓</div>

        <div className="section-eyebrow verified-eyebrow">
          SafePay verification
        </div>

        <h2 className="verified-title">Payment Request Verified</h2>

        <p className="verified-description">
          This request matches the expected private intent. SafePay verified it
          before payment without revealing private payment data.
        </p>
      </div>

      <div className="verified-check-grid">
        <div className={`verified-check-card ${getVerifierClass(browserProofVerified)}`}>
          <span className="verified-check-icon">
            {browserProofVerified ? '✓' : '×'}
          </span>

          <div>
            <strong>Private proof</strong>
            <small>{getVerifierLabel(browserProofVerified)}</small>
          </div>
        </div>

        <div className={`verified-check-card ${getVerifierClass(evmVerified)}`}>
          <span className="verified-check-icon">
            {evmVerified ? '✓' : evmVerified === false ? '×' : '…'}
          </span>

          <div>
            <strong>Verifier check</strong>
            <small>{getVerifierLabel(evmVerified)}</small>
          </div>
        </div>
      </div>

      {proofSize && (
        <div className="proof-size-pill">
          Proof size: <strong>{proofSize} bytes</strong>
        </div>
      )}

      <div className="verified-footer-note">
        Ready for the Nimiq payment step.
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={onResetFlow}
      >
        Verify Another Payment
      </button>
    </section>
  )
}
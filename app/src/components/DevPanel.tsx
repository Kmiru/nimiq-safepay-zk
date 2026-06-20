import type { RefObject } from 'react'
import type { ProofStatus } from '../types/proofStatus'
import type { EvmStatus } from '../types/evmStatus'


type DevPanelProps = {
  devPanelRef: RefObject<HTMLElement | null>
  devZkStatusRef: RefObject<HTMLDivElement | null>
  devEvmStatusRef: RefObject<HTMLDivElement | null>
  demoPaymentLink: string
  status: ProofStatus
  evmStatus: EvmStatus
  onRunZkProof: () => void
  onRunEvmVerification: () => void
}

export function DevPanel({
  devPanelRef,
  devZkStatusRef,
  devEvmStatusRef,
  demoPaymentLink,
  status,
  evmStatus,
  onRunZkProof,
  onRunEvmVerification,
}: DevPanelProps) {
  return (
    <section className="card dev-panel" ref={devPanelRef}>
      <h3 className="dev-title">🛠 Dev Panel</h3>

      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className="btn btn-dark btn-sm" onClick={onRunZkProof}>
          Generate & Verify ZK Proof
        </button>

        <button className="btn btn-dark btn-sm" onClick={onRunEvmVerification}>
          Verify on Local EVM
        </button>
      </div>

      <div className="info-block">
        <strong>Demo payment link:</strong>
        <pre className="code-block">{demoPaymentLink}</pre>
      </div>

      <div className="dev-grid">
        <div ref={devZkStatusRef}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>ZK Browser Proof</h4>

          <div className="dev-stat">
            <span className="label">Module:</span>{' '}
            <span className="value">{status.importsLoaded ? '✅' : '⏳'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Artifact:</span>{' '}
            <span className="value">{status.artifactLoaded ? '✅' : '⏳'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Witness:</span>{' '}
            <span className="value">{status.witnessGenerated ? '✅' : '⏳'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Proof:</span>{' '}
            <span className="value">{status.proofGenerated ? '✅' : '⏳'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Verified:</span>{' '}
            <span className="value">{status.proofVerified ? '✅' : '⏳'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Size:</span>{' '}
            <span className="value">{status.proofSize ?? '—'}</span>
          </div>
        </div>

        <div ref={devEvmStatusRef}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Local EVM Verifier</h4>

          <div className="dev-stat">
            <span className="label">Loading:</span>{' '}
            <span className="value">{evmStatus.loading ? '⏳' : 'no'}</span>
          </div>

          <div className="dev-stat">
            <span className="label">Verified:</span>{' '}
            <span className="value">
              {evmStatus.verified === null
                ? '—'
                : evmStatus.verified
                  ? '✅'
                  : '❌'}
            </span>
          </div>

          {evmStatus.error && <div className="error-block">{evmStatus.error}</div>}
        </div>
      </div>

      {status.publicInputs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Public Inputs</h4>

          <pre className="code-block">
            {JSON.stringify(status.publicInputs, null, 2)}
          </pre>
        </div>
      )}

      {status.error && <div className="error-block">{status.error}</div>}
    </section>
  )
}

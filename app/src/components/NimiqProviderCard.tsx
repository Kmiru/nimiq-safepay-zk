import type { NimiqProviderStatus } from '../types/nimiqProviderStatus'

type NimiqProviderCardProps = NimiqProviderStatus & {
  onConnect: () => void
  onDisconnectLocalState: () => void
}

export function NimiqProviderCard({
  connecting,
  connected,
  account,
  consensusEstablished,
  blockNumber,
  error,
  onConnect,
  onDisconnectLocalState,
}: NimiqProviderCardProps) {
  const statusLabel = connected
    ? 'Connected'
    : connecting
      ? 'Connecting...'
      : 'Not connected'

  const shortAccount = account
    ? `${account.slice(0, 8)}…${account.slice(-6)}`
    : null

  return (
    <section className={`provider-compact-card ${connected ? 'connected' : ''}`}>
      <div className="provider-compact-main">
        <div className="provider-compact-icon">
          {connected ? '✓' : '◈'}
        </div>

        <div className="provider-compact-content">
          <div className="provider-compact-title-row">
            <strong>Nimiq Pay</strong>
            <span className={`provider-status-dot ${connected ? 'connected' : ''}`} />
          </div>

          <p>
            {connected
              ? `${statusLabel}${consensusEstablished ? ' • Consensus ready' : ''}`
              : 'Connect to continue with payment'}
          </p>

          {shortAccount && (
            <small>
              {shortAccount}
              {blockNumber !== null ? ` • Block ${blockNumber}` : ''}
            </small>
          )}
        </div>
      </div>

      <div className="provider-compact-actions">
        <button
          className={`btn ${connected ? 'btn-ghost' : 'btn-primary'} btn-sm`}
          onClick={onConnect}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
        </button>

        {connected && (
          <button
            className="provider-clear-btn"
            onClick={onDisconnectLocalState}
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="error-block provider-error">{error}</div>}
    </section>
  )
}
type AppHeaderProps = {
  showDevPanel: boolean
  onToggleDevPanel: () => void
}

export function AppHeader({
  showDevPanel,
  onToggleDevPanel,
}: AppHeaderProps) {
  return (
    <header className="app-header app-header-compact">
      <div className="header-brand">
        <div className="header-logo" aria-label="SafePay ZK">
          ◈
        </div>

        <div>
          <h1 className="header-title">SafePay ZK</h1>
          <p className="header-subtitle">Verify before you pay</p>
        </div>
      </div>

      <button className="header-dev-btn" onClick={onToggleDevPanel}>
        {showDevPanel ? 'Hide Dev' : 'Dev'}
      </button>
    </header>
  )
}
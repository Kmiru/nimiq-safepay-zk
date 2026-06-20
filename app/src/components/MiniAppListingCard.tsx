export function MiniAppListingCard() {
  return (
    <section className="card mini-app-listing-card">
      <div className="mini-app-listing-header">
        <div className="mini-app-listing-logo">◈</div>

        <div>
          <h2 className="mini-app-listing-title">SafePay ZK</h2>
          <p className="mini-app-listing-type">Nimiq Mini App · Demo mode</p>
        </div>
      </div>

      <p className="mini-app-listing-description">
        Verify Nimiq payment requests with zero-knowledge proofs before sending
        funds.
      </p>

      <div className="mini-app-listing-meta">
        <div>
          <span>Type</span>
          <strong>nimiq</strong>
        </div>

        <div>
          <span>Developer</span>
          <strong>@quetzaltv</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>Local demo</strong>
        </div>
      </div>

      <div className="mini-app-listing-json">
        <span>Mini App entry preview</span>

        <pre className="code-block">
{`{
  "name": "SafePay ZK",
  "url": "https://REPLACE_WITH_PUBLIC_APP_URL",
  "type": "nimiq",
  "description": "Verify Nimiq payment requests with zero-knowledge proofs before sending funds",
  "logo": "./assets/mini-apps/quetzaltv-safepay-zk.svg",
  "source": "https://github.com/REPLACE_WITH_GITHUB_USERNAME/nimiq-safepay-zk",
  "developer": "@quetzaltv",
  "featured": false
}`}
        </pre>
      </div>
    </section>
  )
}

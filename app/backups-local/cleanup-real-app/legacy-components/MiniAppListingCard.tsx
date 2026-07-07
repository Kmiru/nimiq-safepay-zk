const miniAppIconUrl = `${import.meta.env.BASE_URL}icons/mini-app-icon.png`

export function MiniAppListingCard() {
  return (
    <section className="card mini-app-listing-card">
      <div className="mini-app-listing-header">
        <div className="mini-app-listing-logo">
          <img
            src={miniAppIconUrl}
            alt="SafePay ZK mini app icon"
          />
        </div>

        <div>
          <h2 className="mini-app-listing-title">SafePay ZK</h2>
          <p className="mini-app-listing-type">Nimiq Mini App · Demo mode</p>
        </div>
      </div>

      <p className="mini-app-listing-description">
        Create verified payment requests, scan SafePay QR codes, and verify
        before paying with Nimiq Pay.
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
  "url": "https://www.safepayzk.com/",
  "type": "nimiq",
  "description": "Create verified payment requests, scan SafePay QR codes, and verify before paying with Nimiq Pay",
  "logo": "https://www.safepayzk.com/icons/mini-app-icon.png",
  "source": "https://github.com/Kmiru/nimiq-safepay-zk",
  "developer": "@kmiru",
  "featured": false
}`}
        </pre>
      </div>
    </section>
  )
}
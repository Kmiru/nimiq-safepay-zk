# SafePay ZK — Nimiq Pay Readiness

## Current local status

- [x] Runs inside Nimiq Pay locally
- [x] Connects to Nimiq Pay provider
- [x] Reads account
- [x] Checks consensus
- [x] Reads block number
- [x] Reviews SafePay request
- [x] Generates browser ZK proof
- [x] Verifies proof with local EVM verifier
- [x] Shows payment-ready state

## Needed before public listing

- [ ] Public HTTPS app URL
- [ ] Public GitHub repository
- [ ] MIT license
- [ ] Public SVG logo
- [ ] Description under 200 characters
- [ ] Production config separated from local config
- [ ] Replace local Anvil RPC dependency
- [ ] Public verifier strategy decided
- [ ] App tested from Nimiq Pay using public URL
- [ ] Demo video recorded from Nimiq Pay
- [ ] Mini app entry prepared for `nimiq-mini-apps.json`

## Proposed mini app entry

```json
{
  "name": "SafePay ZK",
  "url": "https://REPLACE_WITH_PUBLIC_APP_URL",
  "type": "nimiq",
  "description": "Verify Nimiq payment requests with zero-knowledge proofs before sending funds",
  "logo": "./assets/mini-apps/quetzaltv-safepay-zk.svg",
  "source": "https://github.com/REPLACE_WITH_GITHUB_USERNAME/nimiq-safepay-zk",
  "developer": "@quetzaltv",
  "featured": false
}

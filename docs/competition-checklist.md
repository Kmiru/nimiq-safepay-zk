# Nimiq SafePay ZK — Competition Checklist

## Required

* [ ] Public GitHub repository
* [ ] MIT License included
* [ ] README.md included
* [ ] App runs successfully
* [ ] App works inside Nimiq Pay
* [ ] Nimiq Mini App SDK integrated
* [ ] Nimiq Pay provider connects successfully
* [ ] `listAccounts()` works
* [ ] `isConsensusEstablished()` works
* [ ] `getBlockNumber()` works
* [ ] Payment flow prepared with `sendBasicTransaction()`
* [ ] No private keys committed
* [ ] No secrets committed
* [ ] App is usable on mobile
* [ ] Demo video recorded
* [ ] Submission description prepared

## Core demo flow

* [ ] Open Mini App inside Nimiq Pay
* [ ] Connect Nimiq Pay
* [ ] Load Demo Request
* [ ] Review Payment Link
* [ ] Verify Before Payment
* [ ] Browser ZK Proof succeeds
* [ ] Local EVM Verifier succeeds
* [ ] Private Intent Verified appears
* [ ] Pay with Nimiq card appears

## UI / UX

* [ ] Dev Panel hidden by default
* [ ] Main flow understandable in less than 60 seconds
* [ ] Buttons are clear
* [ ] Payment Review is easy to read
* [ ] Error messages are user-friendly
* [ ] Mobile layout is clean
* [ ] Final success state is clear

## Technical readiness

* [ ] `npm run build` passes
* [ ] `npm run deploy:local-verifier` works
* [ ] Anvil verifier deployment works
* [ ] Mobile can access Vite on port 5173
* [ ] Mobile can access Anvil RPC on port 8545
* [ ] Browser proof works
* [ ] EVM proof works
* [ ] Public inputs are displayed in Dev Panel
* [ ] Latest verifier address is stored in `src/config/localVerifier.ts`

## Documentation

* [ ] `docs/demo-script.md`
* [ ] `docs/current-checkpoint.md`
* [ ] `docs/frontend-component-structure.md`
* [ ] `docs/nimiq-pay-mobile-checkpoint.md`
* [ ] `docs/competition-checklist.md`

## Final submission

* [ ] GitHub repo link ready
* [ ] Demo video link ready
* [ ] Short project description ready
* [ ] Screenshots ready
* [ ] Final mobile test completed

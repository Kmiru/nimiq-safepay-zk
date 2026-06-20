# Nimiq SafePay ZK
## Links

- Landing page: https://kmiru.github.io/nimiq-safepay-zk/
- GitHub repo: https://github.com/Kmiru/nimiq-safepay-zk

**Verify before you pay.**

Nimiq SafePay ZK is a Mini App concept for safer crypto payments inside Nimiq Pay.

It helps users review and verify payment requests before sending funds. A user can load a SafePay payment request, review the recipient, amount, network, and expiration, then verify that the payment request matches a private pre-approved intent using zero-knowledge proofs.

The goal is simple:

```txt
Verify before you pay.
```

## What it does

SafePay ZK demonstrates a safer payment flow:

```txt
Payment request
↓
Payment Review
↓
Verify Before Payment
↓
Browser ZK Proof
↓
Local EVM Verifier
↓
Private Intent Verified
↓
Pay with Nimiq
```

## Why it matters

Payment QR codes and payment links can be difficult for normal users to verify manually.

SafePay ZK adds a verification layer before payment. It checks that the visible payment request matches a private intent without revealing private payment data.

This can help protect users from:

* wrong recipient addresses
* manipulated payment requests
* accidental wrong-network payments
* unverified payment links
* unsafe payment confirmation flows

## Current status

The current MVP is confirmed working as a local Mini App inside Nimiq Pay.

Confirmed working:

* Nimiq Pay provider connection
* account detection
* consensus status
* block number display
* SafePay payment link generation
* QR code generation
* manual payment link review
* Payment Review screen
* Browser ZK proof generation
* Browser ZK proof verification
* Local EVM verifier check
* Private Intent Verified result
* Pay with Nimiq flow prepared

## Main user flow

```txt
Open Mini App
↓
Connect Nimiq Pay
↓
Load or scan a payment request
↓
Review payment details
↓
Verify Before Payment
↓
Private Intent Verified
↓
Pay with Nimiq
```

## Technology

Frontend:

* React
* Vite
* TypeScript
* Nimiq Mini App SDK

Nimiq integration:

* `@nimiq/mini-app-sdk`
* Nimiq Provider
* `listAccounts()`
* `isConsensusEstablished()`
* `getBlockNumber()`
* `sendBasicTransaction()`

Zero-knowledge proof stack:

* Noir
* Nargo
* Barretenberg / bb.js
* Poseidon2
* Solidity Honk Verifier
* Foundry
* Anvil
* viem

## Project structure

```txt
app/
  src/
    components/
    config/
    hooks/
    lib/
    types/
  public/
    circuits/
    evm-test/
  scripts/

circuits/
  payment_intent_match/
  payment_intent_poseidon_calculator/
  poseidon_smoke_test/

contracts/
  PaymentIntentVerifier.sol

docs/
  demo-script.md
  current-checkpoint.md
  frontend-component-structure.md
  nimiq-pay-mobile-checkpoint.md
```

## Local development

Start Anvil:

```bash
cd ~/nimiq-safepay-zk
anvil --host 0.0.0.0 --port 8545 --disable-code-size-limit
```

Deploy the local verifier:

```bash
cd ~/nimiq-safepay-zk/app
npm run deploy:local-verifier
```

Start the frontend:

```bash
cd ~/nimiq-safepay-zk/app
rm -rf node_modules/.vite
npm run dev -- --host 0.0.0.0
```

Open from laptop:

```txt
http://localhost:5173/
```

Open from phone:

```txt
http://WINDOWS_WIFI_IP:5173/
```

## Mobile testing notes

When testing from a phone, the phone needs access to both:

```txt
Frontend:
http://WINDOWS_WIFI_IP:5173

Anvil RPC:
http://WINDOWS_WIFI_IP:8545
```

The app dynamically selects the local Anvil RPC:

```txt
Laptop localhost:
http://127.0.0.1:8545

Phone / Nimiq Pay:
http://WINDOWS_WIFI_IP:8545
```

## Competition demo

Suggested 60-second demo flow:

```txt
1. Open SafePay ZK inside Nimiq Pay.
2. Connect Nimiq Pay.
3. Load Demo Request.
4. Review recipient, amount, network, and expiration.
5. Click Verify Before Payment.
6. Show Private Intent Verified.
7. Show Browser ZK Proof and Local EVM Verifier as verified.
8. Show Pay with Nimiq as the final step.
```

## Current limitations

This is an MVP for the Nimiq Mini Apps Competition.

Current limitations:

* The EVM verifier currently runs on local Anvil.
* Local verifier deployment is automated but must be re-run after restarting Anvil.
* The payment flow is prepared, but final production deployment is still pending.
* The Dev Panel is included for judges and technical review.
* Production hosting and final submission packaging are still pending.

## License

MIT

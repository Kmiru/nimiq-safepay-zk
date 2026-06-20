# Nimiq SafePay ZK — 60 Second Demo Script

## Suggested title

**Nimiq SafePay ZK — Verify Before You Pay**

## Goal

Show that SafePay ZK works inside Nimiq Pay and verifies a payment request before payment.

## 60-second timeline

| Time      | On-screen action                                                                        | Narration                                                                                                              |
| --------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:05 | Open Nimiq Pay and load the SafePay ZK Mini App.                                        | “Meet SafePay ZK, a security layer for your Nimiq payments.”                                                           |
| 0:05–0:10 | Tap **Connect Nimiq Pay**. Show connected status, consensus, and block number.          | “SafePay connects directly to Nimiq Pay and confirms the network is ready.”                                            |
| 0:10–0:18 | Tap **Load Demo Request**, then **Review Payment Link**. Show the Payment Review card.  | “Load or scan a SafePay payment request. The app shows the recipient, amount, network, and expiration before you pay.” |
| 0:18–0:28 | Tap **Verify Before Payment**. Show the button changing to **Verifying...**.            | “Now SafePay generates a zero-knowledge proof directly in the Mini App.”                                               |
| 0:28–0:40 | Show **Private Intent Verified**, **Browser ZK Proof ✅**, and **Local EVM Verifier ✅**. | “The proof confirms the request matches a trusted intent, without revealing private payment data.”        |
| 0:40–0:50 | Show the **Pay with Nimiq** card. If available, tap it and show Nimiq Pay confirmation. | “Only after verification does SafePay prepare the payment step through Nimiq Pay.”                                     |
| 0:50–0:56 | Briefly show the clean flow again: Review → Verify → Pay.                               | “SafePay ZK adds one simple layer before payment: review, verify, then pay.”                                           |
| 0:56–1:00 | Final screen with project name and tagline.                                             | “Nimiq SafePay ZK. Verify before you pay.”                                                                             |

## Optional line if real payment succeeds

Use this only if the payment was actually sent successfully:

```txt
The payment is sent securely, and the app returns a transaction hash as proof of payment.
```

## Important visual shots

Show these clearly:

```txt
1. SafePay ZK running inside Nimiq Pay
2. Nimiq Pay connected
3. Consensus established
4. Payment Review card
5. Verify Before Payment button
6. Private Intent Verified result
7. Browser ZK Proof ✅
8. Local EVM Verifier ✅
9. Pay with Nimiq card
```

## Avoid showing too much

Do not spend too much time on:

```txt
raw proof bytes
long public input arrays
terminal logs
contract deployment logs
raw QR payload
```

The Dev Panel can appear briefly, but the main video should focus on the user flow.

## Core message

```txt
SafePay ZK helps users verify payment requests before sending funds.
It checks the visible payment details and uses zero-knowledge proofs to confirm the request matches a private approved intent.
```

## Short submission description

SafePay ZK is a Nimiq Pay Mini App that helps users verify payment requests before sending funds. It reviews the recipient, amount, network, and expiration, then generates a browser-based zero-knowledge proof to confirm the payment matches a private approved intent. Only after verification does the app prepare the Nimiq Pay payment step.

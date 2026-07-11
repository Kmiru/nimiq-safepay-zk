# SafePay ZK

**Verify before you pay.**

SafePay ZK is a Nimiq Pay Mini App prototype that adds a verification layer before sending a payment.

The goal is simple: help users review and verify a payment request before they confirm the transaction in Nimiq Pay.

SafePay ZK does not replace Nimiq Pay. Nimiq Pay still handles the wallet, user confirmation, and transaction. SafePay ZK adds the pre-payment verification flow.

---

## Try it inside Nimiq Pay

SafePay ZK runs inside Nimiq Pay as a Mini App.

Open Nimiq Pay, add or search a Mini App by URL, and enter:

```txt
https://safepayzk.com
```

Current version: **testnet prototype**

---

## What works today

SafePay ZK currently supports a full testnet payment flow:

### Business flow

A business can:

* Connect with Nimiq Pay
* Create a payment request
* Add order items
* Generate a SafePay QR code
* Show the QR to a customer
* View order history
* Detect Paid / Expired status while the app is open
* View receipts
* Copy the transaction hash

### Personal flow

A user can:

* Connect with Nimiq Pay
* Scan a SafePay QR code
* Review the payment request
* Verify before payment
* Pay through Nimiq Pay on testnet
* See the request as already paid after payment

---

## Current architecture

SafePay ZK currently uses:

```txt
testnet + blockchain-only + auto-check while Business is open
```

There is no backend yet.

The app creates local SafePay requests and uses the Nimiq testnet blockchain as the payment source of truth. When Business is open, the app checks the blockchain and updates order status based on matching transactions.

A payment is considered valid only when the transaction matches the expected recipient, amount, network, timing, and SafePay intent data.

---

## Current flow

```txt
Business creates a payment request
↓
SafePay generates a QR code
↓
Personal scans the QR
↓
Personal reviews the request
↓
SafePay verifies before payment
↓
Nimiq Pay sends the testnet transaction
↓
SafePay reads the blockchain
↓
Business shows Paid or Expired
```

---

## Why SafePay ZK matters

Crypto payments are final. Before sending funds, users should be able to verify that the request they are about to pay matches the intended recipient, amount, network, and order details.

SafePay ZK adds a verification step before payment confirmation.

The current prototype demonstrates the user experience and payment flow on Nimiq testnet.

---

## Current status

* Testnet prototype
* Runs inside Nimiq Pay as a Mini App
* Business can create payment requests
* Personal can scan, review, verify, and pay
* Payments are sent through Nimiq Pay
* Payment data includes SafePay intent data
* Business can detect Paid / Expired status from the blockchain while open
* Receipts show status, amount, network, and transaction hash
* Self-payments are blocked

---

## Roadmap

### Phase 1 — Competition prototype polish

Current phase.

Goals:

* Keep the testnet prototype stable
* Block self-payments
* Polish Business and Personal flows
* Improve receipts
* Improve status labels
* Prepare the project for competition submission

### Phase 2 — Real ZK verification

Next step after the competition prototype.

Goals:

* Remove the fixed demo proof
* Generate a unique intentHash per order
* Connect the ZK proof to each real payment request
* Verify the proof before enabling PAY
* Keep the payment transaction linked to the verified intent

### Phase 3 — Mainnet preparation

Goals:

* Separate testnet and mainnet storage
* Add strict network validation
* Prevent testnet/mainnet order mixing
* Block self-payments on mainnet
* Test mainnet with very small payments

### Phase 4 — Backend or indexer

Goals:

* Store orders server-side
* Detect Paid / Expired even when Business is closed
* Improve order history across devices
* Keep the backend non-custodial
* Never store private keys

### Phase 5 — Production hardening

Goals:

* Review and audit the payment flow
* Review the ZK circuit
* Improve logs and error handling
* Add privacy documentation
* Improve receipts and UX
* Prepare for real-world usage

---

## Important note

SafePay ZK is currently a testnet prototype.

It is designed to demonstrate the SafePay payment verification flow inside Nimiq Pay. It is not yet intended for real mainnet payments.

---

## Motto

```txt
Verify before you pay.
```

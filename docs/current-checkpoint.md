# Nimiq SafePay ZK — Current Checkpoint

Last updated: 2026-05-30

## Checkpoint summary

This checkpoint confirms the current working state of the Nimiq SafePay ZK MVP.

The project now has a complete local demo flow:

```txt
SafePay payment request
↓
Payment link / QR
↓
Manual paste or QR scan
↓
Payment Review
↓
Verify Before Payment
↓
Browser ZK proof
↓
Local EVM verifier
↓
Private Intent Verified
```

## Current status

Confirmed working:

* Noir circuit compilation
* Poseidon2 intent hash logic
* Browser proof generation
* Browser proof verification
* Node proof generation
* Negative test cases
* Solidity verifier generation
* Local EVM verification with Foundry
* Local Anvil deployment
* Frontend EVM verification with `viem`
* SafePay payment link generation
* QR code generation
* QR scanner
* Manual payment link reader
* Payment Review card
* Unified `Verify Before Payment` button
* Smooth scrolling to important UI sections
* Dev Panel for technical debugging

## Current main user flow

The user-facing demo flow is:

```txt
Load Demo Request
↓
Review Payment Link
↓
Payment Review appears
↓
Verify Before Payment
↓
Verifying...
↓
Private Intent Verified
```

Expected final UI result:

```txt
✅ Private intent verified
Verified
```

## Current technical verification flow

When the user clicks:

```txt
Verify Before Payment
```

the app runs:

```txt
generateAndVerifyPaymentIntentProof(...)
↓
NoirJS witness generation
↓
Barretenberg browser proof generation
↓
Barretenberg browser proof verification
↓
loadEvmProofFiles()
↓
verifyPaymentIntentProofOnEvm(...)
↓
HonkVerifier.verify(proof, publicInputs)
```

Expected technical results:

```txt
Browser ZK Proof: ✅
Local EVM Verifier: ✅
Proof Size: 16256 bytes
```

## Current app files

Important frontend files:

```txt
app/src/App.tsx
app/src/App.css
app/src/lib/canonicalFields.ts
app/src/lib/ethereumVerifier.ts
app/src/lib/evmProofFiles.ts
app/src/lib/humanPayloadToCircuitPayload.ts
app/src/lib/humanSafePayPayload.ts
app/src/lib/intentHash.ts
app/src/lib/paymentIntentInputs.ts
app/src/lib/paymentReview.ts
app/src/lib/qrCode.ts
app/src/lib/safepayPayload.ts
app/src/lib/safepayQrPayload.ts
app/src/lib/zkProof.ts
```

Important circuit files:

```txt
circuits/payment_intent_match/src/main.nr
circuits/payment_intent_match/Prover.toml
circuits/payment_intent_match/target/payment_intent_match.json
circuits/payment_intent_match/target/payment_intent_match.gz
circuits/payment_intent_match/target/proof
circuits/payment_intent_match/target/public_inputs
circuits/payment_intent_match/target/vk
circuits/payment_intent_match/target/vk_hash
```

Important Solidity files:

```txt
contracts/PaymentIntentVerifier.sol
test/PaymentIntentVerifier.t.sol
foundry.toml
```

## Current demo payload

The current demo payment request uses:

```txt
Recipient: NQ00 0000 0000 0000 0000 0000 0000 0000 0000
Amount: 25 NIM
Network: nimiq-testnet
Nimiq network: TestAlbatross
EVM verifier chain: 31337
Expires at: 1893456000
```

The current expiration timestamp is intentionally set in the future for demo purposes.

## Current public inputs

The current proof exposes two public inputs:

```txt
intent_hash
nullifier
```

These are generated from the current human SafePay payload after canonicalization.

## How to run the local demo

### 1. Start Anvil

```bash
cd ~/nimiq-safepay-zk
anvil --host 0.0.0.0 --port 8545 --disable-code-size-limit
```

### 2. Start the frontend

```bash
cd ~/nimiq-safepay-zk/app
npm run dev -- --host
```

Open:

```txt
http://localhost:5173/
```

### 3. Run the demo

In the UI:

```txt
Load Demo Request
Review Payment Link
Verify Before Payment
```

Expected result:

```txt
Private Intent Verified
```

## How to rebuild frontend

```bash
cd ~/nimiq-safepay-zk/app
npm run build
```

The Barretenberg bundle is large, so Vite may show a chunk-size warning. This is expected for the current technical MVP.

## How to regenerate the browser artifact

From the circuit folder:

```bash
cd ~/nimiq-safepay-zk/circuits/payment_intent_match

nargo check
nargo test
nargo execute
nargo compile
```

Then copy the artifact to the frontend:

```bash
cp ~/nimiq-safepay-zk/circuits/payment_intent_match/target/payment_intent_match.json ~/nimiq-safepay-zk/app/public/circuits/payment_intent_match.json
```

## How to regenerate EVM proof files

From the circuit folder:

```bash
cd ~/nimiq-safepay-zk/circuits/payment_intent_match

bb prove \
  -b ./target/payment_intent_match.json \
  -w ./target/payment_intent_match.gz \
  -o ./target \
  --oracle_hash keccak
```

Verify:

```bash
bb verify \
  -k ./target/vk \
  -p ./target/proof \
  -i ./target/public_inputs \
  --oracle_hash keccak
```

Copy proof files to the frontend:

```bash
cd ~/nimiq-safepay-zk

cp circuits/payment_intent_match/target/proof app/public/evm-test/proof.bin
cp circuits/payment_intent_match/target/public_inputs app/public/evm-test/public_inputs.bin
```

## Current limitations

The current MVP is still a local technical prototype.

Known limitations:

* The EVM verifier runs locally on Anvil.
* Anvil must use `--disable-code-size-limit`.
* The Solidity verifier is large.
* Poseidon2 public values are still generated through a Noir calculator flow and copied into the frontend.
* Real Nimiq payment execution is not connected yet.
* Real Nimiq Mini App SDK payment flow is still pending.
* Browser proof and Solidity-compatible proof currently use separate proof-generation flows.
* The UI is now more polished, but the code still lives mostly in `App.tsx`.

## Next recommended phase

Next phase:

```txt
Fase 4.5 — split App.tsx into components
```

Goal:

Make the frontend easier to maintain before adding real Nimiq payment integration.

Planned component split:

```txt
app/src/components/AppHeader.tsx
app/src/components/ScanPaymentCard.tsx
app/src/components/PaymentReviewCard.tsx
app/src/components/VerifiedResultCard.tsx
app/src/components/DevPanel.tsx
```

After that:

```txt
Fase 5 — Nimiq Mini App / Payment Provider Integration
```

Goal:

```txt
Private Intent Verified
↓
Enable Nimiq payment button
↓
Send payment
↓
Show receipt
```
## Frontend cache troubleshooting

If Node verification succeeds but the browser says:

```txt
The verifier rejected this payment request. Do not continue with this payment.
## Anvil / verifier address troubleshooting

If the browser or Dev Panel shows:

```txt
The contract function "verify" returned no data ("0x").
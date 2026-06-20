# Nimiq SafePay ZK — Frontend Notes

Last updated: 2026-05-30

## Status

The frontend now has a working proof-generation and local EVM verification flow.

Confirmed working:

- Browser proof generation
- Browser proof verification with `bb.js`
- Reusable ZK proof module
- Demo SafePay payload module
- Circuit inputs generated from a payload object
- Local EVM verifier call using `viem`
- Local Anvil `HonkVerifier.verify(...)` returns `true`

## Current frontend files

```txt
app/src/lib/
├─ safepayPayload.ts
├─ intentHash.ts
├─ paymentIntentInputs.ts
├─ zkProof.ts
├─ evmProofFiles.ts
└─ ethereumVerifier.ts

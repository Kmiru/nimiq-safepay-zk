# Nimiq SafePay ZK — Payload Canonicalization Notes

Last updated: 2026-05-30

## Status

The frontend now supports a human-readable SafePay payload and converts it into circuit-compatible fields.

## Current files

```txt
app/src/lib/humanSafePayPayload.ts
app/src/lib/humanPayloadToCircuitPayload.ts
app/src/lib/canonicalFields.ts
app/src/lib/safepayPayload.ts
app/src/lib/intentHash.ts
app/src/lib/paymentIntentInputs.ts

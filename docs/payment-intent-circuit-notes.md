# payment_intent_match Circuit Notes

## Purpose

The `payment_intent_match` circuit proves that a prover knows the private payment intent fields that produce a public `intent_hash` and `nullifier`.

This supports the SafePay ZK concept:

> Verify before you pay.

## Current v0.1 inputs

Public inputs:

- `intent_hash`
- `nullifier`

Private inputs:

- `domain_separator`
- `nimiq_network_id`
- `evm_verifier_chain_id`
- `version_field`
- `type_field`
- `network_field`
- `recipient_field`
- `amount_luna`
- `memo_secret_hash_field`
- `expires_at`
- `nonce_field`
- `salt_field`
- `secret_field`

## Current v0.1 behavior

The circuit computes:

```txt
computed_intent_hash = Poseidon2::hash()(all payment intent fields)
computed_nullifier = Poseidon2::hash()(computed_intent_hash, secret_field)

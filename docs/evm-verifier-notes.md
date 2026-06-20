# Nimiq SafePay ZK — EVM Verifier Notes

Last updated: 2026-05-30

## Status

The `payment_intent_match` Solidity verifier has been generated and tested locally.

The verifier flow is confirmed working for:

- Barretenberg CLI proof generation
- Barretenberg CLI verification
- Solidity verifier generation
- Foundry local test
- Anvil local deployment
- RPC verification call using `viem`

## Generated files

The EVM verification flow uses these files:

```txt
contracts/PaymentIntentVerifier.sol
circuits/payment_intent_match/target/vk
circuits/payment_intent_match/target/vk_hash
circuits/payment_intent_match/target/proof
circuits/payment_intent_match/target/public_inputs

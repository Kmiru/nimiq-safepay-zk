# Nimiq SafePay ZK — Working Toolchain Versions

Last updated: 2026-05-30

## Status

This toolchain is confirmed working for:

* Noir circuit compilation
* Noir circuit execution
* Browser witness generation
* Browser proof generation
* Browser proof verification
* Node proof generation
* Node proof verification

## Core versions

* Node.js: v22.22.3
* npm: 10.9.8
* Nargo: 1.0.0-beta.21
* Noirc: 1.0.0-beta.21
* Vite: 5.4.21
* React: 19.2.6

## ZK packages

* @noir-lang/noir_js: 1.0.0-beta.21
* @noir-lang/noirc_abi: 1.0.0-beta.21
* @noir-lang/acvm_js: 1.0.0-beta.21
* @aztec/bb.js: 3.0.0-nightly.20260106

## Nimiq package

* @nimiq/mini-app-sdk: 0.1.0

## Notes

The previous stack using:

* @noir-lang/noir_js: 1.0.0-beta.20
* @aztec/bb.js: 3.0.0-nightly.20251104

failed during proof generation with:

```txt
Length is too large
```

The current stack fixed this issue.

## Current circuit status

Current circuit:

```txt
circuits/payment_intent_match
```

Status:

* v0.2 working
* Uses Poseidon2 via `noir-lang/poseidon`
* Proof generation works in Node
* Proof verification works in Node
* Proof generation works in browser
* Proof verification works in browser
* Positive test cases work
* Negative/tampered test cases work

## Current hash implementation

The circuit now uses:

```rust
Poseidon2::hash(...)
```

Current behavior:

```txt
computed_intent_hash = Poseidon2::hash(all payment intent fields)
computed_nullifier = Poseidon2::hash(computed_intent_hash, secret_field)
```

The old temporary `mix()` function has been removed and should not be used again.

## Noir circuit dependency

The `payment_intent_match` circuit uses the official Poseidon library:

```toml
poseidon = { git = "https://github.com/noir-lang/poseidon", tag = "v0.3.0" }
```

## Important implementation notes

String values are not passed directly into the circuit.

Fields such as:

* `SAFEPAY-ZK-V1`
* `TestAlbatross`
* `nimiq-testnet`
* recipient addresses

must be canonicalized and converted into `Field` values off-chain before generating the proof.

The circuit should receive only normalized values such as:

* `Field`
* `u64`
* `u32`

## Current public test values

Current Poseidon2 public values used for the test payment intent:

```txt
intent_hash = 0x1a93a6e2a1063e612c60c258557c286c33366e640ab4a44f4342042fc379da56
nullifier = 0x0e8cb331ce76e2b62720a36ccbbd4f816baf7ce2b25aa307afabbcedf04e9f0c
```

## Current validated behavior

The following behavior has been validated:

* A valid payment intent generates a proof successfully
* A valid payment intent proof verifies successfully
* A tampered amount fails
* A tampered recipient fails
* A tampered Nimiq network fails
* A tampered EVM verifier chain fails
* A tampered nullifier fails
* A tampered secret fails

## Next planned step

The next step is to keep Poseidon2 as the circuit hash and move toward:

* cleaner frontend proof generation code
* reusable `zkProof.ts`
* canonical payment payload generation
* real SafePay ZK UI flow
* verifier contract generation for EVM
* EVM verification using `eth_call`

# EVM Verifier Notes

## Status

The `payment_intent_match` Solidity verifier has been generated and tested locally.

## Generated files

- `contracts/PaymentIntentVerifier.sol`
- `circuits/payment_intent_match/target/vk`
- `circuits/payment_intent_match/target/vk_hash`
- `circuits/payment_intent_match/target/proof`
- `circuits/payment_intent_match/target/public_inputs`

## Solidity verifier

The generated Solidity verifier contract is:

```txt
HonkVerifier
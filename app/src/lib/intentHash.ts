import type { SafePayPayload } from './safepayPayload'

export type CircuitInputs = {
  intent_hash: string
  nullifier: string
  domain_separator: string
  nimiq_network_id: string
  evm_verifier_chain_id: string
  version_field: string
  type_field: string
  network_field: string
  recipient_field: string
  amount_luna: string
  memo_secret_hash_field: string
  expires_at: string
  nonce_field: string
  salt_field: string
  secret_field: string
}

// These values currently come from the Poseidon2 calculator.
// Later, we will compute them from the payload in the app.
export const demoPoseidonPublicValues = {
  intentHash:
    '0x09a0b6f2d2a157bbdb9d3b7d4339faa4c52c9928f0e53bf0a9dc6697f771935b',
  nullifier:
    '0x0deacb9c98c2f2f5fb5a93ac512ee7a3f1b57012d0ea828f99d036d4aa5eb77e',
} as const

export function buildCircuitInputsFromPayload(
  payload: SafePayPayload
): CircuitInputs {
  return {
    intent_hash: demoPoseidonPublicValues.intentHash,
    nullifier: demoPoseidonPublicValues.nullifier,

    domain_separator: payload.domainSeparator,
    nimiq_network_id: payload.nimiqNetworkId,
    evm_verifier_chain_id: payload.evmVerifierChainId,
    version_field: payload.version,
    type_field: payload.type,
    network_field: payload.network,
    recipient_field: payload.recipient,
    amount_luna: payload.amountLuna,
    memo_secret_hash_field: payload.memoSecretHash,
    expires_at: payload.expiresAt,
    nonce_field: payload.nonce,
    salt_field: payload.salt,
    secret_field: payload.secret,
  }
}

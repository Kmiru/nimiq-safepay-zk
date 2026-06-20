use poseidon::poseidon2::Poseidon2;

fn compute_intent_hash(
    domain_separator: Field,
    nimiq_network_id: Field,
    evm_verifier_chain_id: Field,
    version_field: Field,
    type_field: Field,
    network_field: Field,
    recipient_field: Field,
    amount_luna: u64,
    memo_secret_hash_field: Field,
    expires_at: u32,
    nonce_field: Field,
    salt_field: Field,
) -> Field {
    Poseidon2::hash(
        [
            domain_separator,
            nimiq_network_id,
            evm_verifier_chain_id,
            version_field,
            type_field,
            network_field,
            recipient_field,
            amount_luna as Field,
            memo_secret_hash_field,
            expires_at as Field,
            nonce_field,
            salt_field,
        ],
        12,
    )
}

fn compute_nullifier(intent_hash: Field, secret_field: Field) -> Field {
    Poseidon2::hash([intent_hash, secret_field], 2)
}

fn main(
    domain_separator: Field,
    nimiq_network_id: Field,
    evm_verifier_chain_id: Field,
    version_field: Field,
    type_field: Field,
    network_field: Field,
    recipient_field: Field,
    amount_luna: u64,
    memo_secret_hash_field: Field,
    expires_at: u32,
    nonce_field: Field,
    salt_field: Field,
    secret_field: Field,
) -> pub (Field, Field) {
    let intent_hash = compute_intent_hash(
        domain_separator,
        nimiq_network_id,
        evm_verifier_chain_id,
        version_field,
        type_field,
        network_field,
        recipient_field,
        amount_luna,
        memo_secret_hash_field,
        expires_at,
        nonce_field,
        salt_field,
    );

    let nullifier = compute_nullifier(intent_hash, secret_field);

    (intent_hash, nullifier)
}
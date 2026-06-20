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
    // Public inputs
    intent_hash: pub Field,
    nullifier: pub Field,

    // Private inputs
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
) {
    let computed_intent_hash = compute_intent_hash(
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

    let computed_nullifier = compute_nullifier(computed_intent_hash, secret_field);

    assert(computed_intent_hash == intent_hash);
    assert(computed_nullifier == nullifier);
}

#[test]
fn test_payment_intent_match() {
    let domain_separator = 1001;
    let nimiq_network_id = 2001;
    let evm_verifier_chain_id = 11155111;
    let version_field = 1;
    let type_field = 3001;
    let network_field = 4001;
    let recipient_field = 5001;
    let amount_luna = 2500000;
    let memo_secret_hash_field = 6001;
    let expires_at = 1780000000;
    let nonce_field = 7001;
    let salt_field = 8001;
    let secret_field = 9001;

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

    main(
        intent_hash,
        nullifier,
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
        secret_field,
    );
}
use poseidon::poseidon2::Poseidon2;

fn main(x: Field, y: Field, expected_hash: pub Field) {
    let computed_hash = Poseidon2::hash([x, y], 2);
    assert(computed_hash == expected_hash);
}

#[test]
fn test_poseidon_smoke() {
    let x = 1;
    let y = 2;

    let expected_hash = Poseidon2::hash([x, y], 2);

    main(x, y, expected_hash);
}

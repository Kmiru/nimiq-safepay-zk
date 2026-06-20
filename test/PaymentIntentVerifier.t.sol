// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../contracts/PaymentIntentVerifier.sol";

interface Vm {
    function readFileBinary(string calldata path) external view returns (bytes memory);
}

contract PaymentIntentVerifierTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function testValidPaymentIntentProof() public {
        HonkVerifier verifier = new HonkVerifier();

        bytes memory proof = vm.readFileBinary(
            "circuits/payment_intent_match/target/proof"
        );

        bytes memory publicInputsRaw = vm.readFileBinary(
            "circuits/payment_intent_match/target/public_inputs"
        );

        require(publicInputsRaw.length % 32 == 0, "Invalid public inputs length");

        uint256 publicInputCount = publicInputsRaw.length / 32;
        bytes32[] memory publicInputs = new bytes32[](publicInputCount);

        for (uint256 i = 0; i < publicInputCount; i++) {
            bytes32 value;

            assembly {
                value := mload(add(add(publicInputsRaw, 0x20), mul(i, 0x20)))
            }

            publicInputs[i] = value;
        }

        bool verified = verifier.verify(proof, publicInputs);

        require(verified, "Proof did not verify");
    }
}

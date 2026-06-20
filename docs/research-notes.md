Nimiq SafePay ZK – Research Notes
Purpose
This document records the official documentation, commands, tooling assumptions, and open technical questions for Nimiq SafePay ZK before locking versions in versions.md.
This file belongs to:
docs/research-notes.md
Current implementation phase:
Phase 0 – Development Environment and ZK Toolchain
Task 0.0 – Validate current official documentation

1. Official documentation to validate
1.1 Noir / Nargo
Official areas to validate:
- Noir quick start
- Nargo install method
- nargo new
- nargo compile
- nargo execute
- nargo test
- Prover.toml format
- public inputs syntax using pub
- supported hash functions
- current Noir version
Questions to answer:
[ ] What is the current recommended Noir version?
[ ] What is the current recommended Nargo install command?
[ ] Does the current version support the syntax we need for Field inputs?
[ ] What hash function should we use for payment_intent_match?
[ ] Are public inputs still declared with pub?
[ ] What artifact does nargo compile generate?
Commands to validate:
nargo --version
nargo new hello_world
cd hello_world
nargo check
nargo compile
nargo execute
nargo test
Decision needed:
Use Nargo as the first circuit compiler and test runner.
Do not start SafePay circuit until hello_world compiles and runs.

2. NoirJS / Browser proving
Official areas to validate:
- NoirJS browser tutorial
- Required packages
- Artifact loading format
- Input format for NoirJS
- Witness generation flow
- Proof generation flow
- Proof verification flow
- Browser support
- WASM loading requirements
Packages to investigate:
@noir-lang/noir_js
@noir-lang/noirc_abi
@noir-lang/acvm_js
@aztec/bb.js
Questions to answer:
[ ] Which NoirJS version matches the selected Nargo version?
[ ] Which bb.js version matches NoirJS?
[ ] Does bb.js run correctly in Vite?
[ ] Does it require special Vite config for WASM?
[ ] Can the proof be generated fully in the browser?
[ ] Can proof verification be tested locally before deploying an EVM verifier?
PoC goal:
Noir circuit → compiled artifact → loaded by browser → proof generated with bb.js
Decision needed:
The first browser PoC must be hello_world, not payment_intent_match.

3. Barretenberg / bb / Solidity verifier
Official areas to validate:
- Barretenberg getting started
- bb CLI install
- proof generation commands
- verification key generation
- Solidity verifier generation
- verifier contract output format
- expected Solidity compiler version
- expected proof/public inputs format
Questions to answer:
[ ] What bb CLI version matches selected Noir/Nargo?
[ ] What exact command generates Verifier.sol?
[ ] Does the verifier require a specific Solidity version?
[ ] What is the function signature of the generated verifier?
[ ] Does the verifier support eth_call cleanly?
[ ] Are public inputs bytes32[], Field[], or another format?
Commands to validate:
bb --version
bb write_vk --help
bb prove --help
bb verify --help
bb write_solidity_verifier --help
Decision needed:
Do not choose Hardhat or Foundry until Verifier.sol is generated and inspected.

4. Nimiq Mini Apps / Mini App SDK
Official areas to validate:
- Nimiq Mini App tutorial
- local mini app loading
- @nimiq/mini-app-sdk install
- init() helper
- Nimiq provider access
- limitations of mini app environment
- required local dev server config
Questions to answer:
[ ] What Node.js version is recommended for local mini app development?
[ ] What is the recommended Vite setup?
[ ] How is a local mini app loaded inside Nimiq Pay?
[ ] Does the dev server need --host?
[ ] What API does init() return?
[ ] Does the mini app run inside an iframe/webview-like environment?
Commands to validate:
npm create vite@latest app -- --template react-ts
cd app
npm install @nimiq/mini-app-sdk
npm run dev -- --host
Decision needed:
Build the frontend only after ZK hello_world PoC works.

5. Nimiq Provider API
Official areas to validate:
- init()
- isConsensusEstablished()
- getBlockNumber()
- sendBasicTransaction()
- sendBasicTransactionWithData()
- accepted transaction data format
- amount unit expected by API
- address format expected by API
Questions to answer:
[ ] Exact method signature of sendBasicTransactionWithData?
[ ] Does it accept amount in Luna or NIM?
[ ] How is validityStartHeight passed?
[ ] What does the success response return?
[ ] Does it return transaction hash directly?
[ ] What maximum data size is accepted?
SafePay decision:
The NIM transaction data field must contain only:
safepay:v1:<intentHash>
Forbidden in NIM data:
names
emails
phone numbers
private notes
raw memo secrets
personal identity data
full payment intent

6. Nimiq Ethereum Provider
Official areas to validate:
- window.ethereum access
- EIP-1193 support
- EIP-6963 discovery
- eth_call support
- chain switching behavior
- account request behavior
- provider availability inside Nimiq Pay
Questions to answer:
[ ] Is window.ethereum always available inside Nimiq Pay mini apps?
[ ] Does the user need to connect an EVM account before eth_call?
[ ] How does the provider handle wrong network?
[ ] Can the mini app request Sepolia or another testnet?
[ ] What error shape does eth_call return?
SafePay decision:
MVP uses eth_call only for proof verification.
MVP does not write verifier state on-chain.
MVP does not register nullifiers on-chain.

7. SafePay technical decisions already approved
7.1 UI proof text
Must remain:
✅ ZK proof valid
Do not replace it with another phrase.
7.2 intentHash canonical definition
Approved v1.0 definition:
intentHash = hash(
  "SAFEPAY-ZK-V1",
  nimiqNetworkId,
  evmVerifierChainId,
  version,
  type,
  network,
  recipientField,
  amountLuna,
  memoSecretHashField,
  expiresAt,
  nonceField,
  salt
)
7.3 Network separation
Use separate fields:
nimiqNetworkId
evmVerifierChainId
Do not use one generic chain_id.
Reason:
Nimiq payment network and EVM verifier network are different security domains.
7.4 MVP proof mode
eth_call verifies proof validity.
eth_call does not write state.
eth_call does not permanently block nullifier reuse.
7.5 First milestone
The first coding milestone is:
payment_intent_match circuit
+
local Noir test
+
browser proof generation

8. Open technical decisions before versions.md
Complete these before creating versions.md:
[ ] Select Node.js version.
[ ] Select package manager: npm, pnpm, or yarn.
[ ] Select Nargo version.
[ ] Select NoirJS version.
[ ] Select bb.js version.
[ ] Select bb CLI version.
[ ] Select Vite version.
[ ] Select TypeScript version.
[ ] Select @nimiq/mini-app-sdk version.
[ ] Decide Hardhat vs Foundry after Verifier.sol is generated.
[ ] Select EVM testnet for verifier.
Recommended temporary default:
Use npm first.
Use Vite + React + TypeScript.
Use Sepolia for verifier testing unless Nimiq Pay test environment requires another EVM network.

9. Known risks to track
9.1 Version mismatch
Risk:
Nargo, NoirJS, bb.js and bb CLI may be incompatible if versions are mixed.
Mitigation:
Pin exact versions in versions.md.
Test hello_world before SafePay circuit.
9.2 Browser proving performance
Risk:
Proof generation in browser may be slow on low-end devices.
Mitigation:
Start with a very small circuit.
Avoid string parsing inside Noir.
Convert strings to Field values outside the circuit.
9.3 EVM verifier mismatch
Risk:
Generated proof format may not match generated Solidity verifier.
Mitigation:
Generate proof and verifier from the same compiled circuit and toolchain version.
Test eth_call from a Node script before integrating React UI.
9.4 Nimiq data field misuse
Risk:
Sensitive data could accidentally be written on-chain.
Mitigation:
Only write safepay:v1:<intentHash> to the NIM transaction data field.
Reject or strip all other data.

10. Output of Task 0.0
Task 0.0 is complete when this file contains:
[ ] Official docs reviewed.
[ ] Current install commands recorded.
[ ] Current package names recorded.
[ ] Toolchain compatibility notes recorded.
[ ] Open risks recorded.
[ ] Initial decision for package manager recorded.
[ ] Ready to create versions.md.
After this file is complete, move to:
Task 0.1 – Create versions.md
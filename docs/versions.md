# Nimiq SafePay ZK – versions.md

## Purpose

This file locks the development versions for Nimiq SafePay ZK.

The goal is to prevent compatibility problems between:

```txt
Nargo / Noir compiler
NoirJS
Barretenberg / bb.js
bb CLI
Vite
Nimiq Mini App SDK
EVM verifier tooling
```

This file belongs to:

```txt
versions.md
```

Current phase:

```txt
Phase 0 – Development Environment and ZK Toolchain
Task 0.1 – Pin and document versions
```

---

## 1. Version strategy

The project uses two version groups:

```txt
Group A – ZK toolchain
Must be pinned strictly.

Group B – Frontend / Mini App tooling
Can start with latest stable, but must be recorded after install.
```

Reason:

```txt
Noir, Nargo, NoirJS, bb.js and bb CLI are tightly coupled.
A mismatch can break proof generation, witness generation, or Solidity verifier compatibility.
```

---

## 2. Operating system

Development OS:

```txt
Windows 10 / Windows 11
```

Recommended shell:

```txt
PowerShell
```

Optional:

```txt
WSL2 Ubuntu
```

Decision:

```txt
Use Windows PowerShell first.
Use WSL2 only if Noir, Nargo, bb, or WASM tooling causes Windows-specific problems.
```

---

## 3. Node.js

Selected version:

```txt
Node.js 22.x LTS or newer Node 22 release
```

Reason:

```txt
Nimiq local mini app documentation requires Node.js 22+ for the examples.
Vite also supports modern Node versions.
```

Check command:

```powershell
node -v
npm -v
```

Expected:

```txt
node >= 22.x
npm >= 10.x
```

If Node is missing or old, install with NVM for Windows:

```powershell
nvm install 22
nvm use 22
node -v
npm -v
```

---

## 4. Package manager

Selected package manager:

```txt
npm
```

Reason:

```txt
Nimiq documentation uses npm.
Vite works cleanly with npm.
Using npm reduces complexity for the first MVP.
```

Do not use yet:

```txt
pnpm
yarn
bun
```

Reason:

```txt
Avoid adding another compatibility variable during the first ZK PoC.
```

---

## 5. Noir / Nargo

Selected version:

```txt
nargo 1.0.0-beta.20
```

Reason:

```txt
The official NoirJS browser tutorial pins nargo to 1.0.0-beta.20 and pairs it with @noir-lang/noir_js@1.0.0-beta.20 and @aztec/bb.js@3.0.0-nightly.20251104.
```

Install command:

```powershell
noirup -v 1.0.0-beta.20
```

Verify:

```powershell
nargo --version
```

Expected:

```txt
nargo version = 1.0.0-beta.20
```

Notes:

```txt
Do not upgrade Nargo until the hello_world PoC and payment_intent_match circuit both work.
If Nargo changes, NoirJS and bb.js must be retested.
```

---

## 6. NoirJS

Selected package:

```txt
@noir-lang/noir_js
```

Selected version:

```txt
1.0.0-beta.20
```

Install command:

```powershell
npm install @noir-lang/noir_js@1.0.0-beta.20
```

Reason:

```txt
Must match the selected Nargo version.
```

---

## 7. Barretenberg / bb.js

Selected package:

```txt
@aztec/bb.js
```

Selected version:

```txt
3.0.0-nightly.20251104
```

Install command:

```powershell
npm install @aztec/bb.js@3.0.0-nightly.20251104
```

Reason:

```txt
The official NoirJS tutorial states that @noir-lang/noir_js@1.0.0-beta.20 works with @aztec/bb.js@3.0.0-nightly.20251104.
```

---

## 8. Browser polyfills for NoirJS / bb.js

Selected packages:

```txt
buffer
vite-plugin-node-polyfills
```

Selected versions:

```txt
buffer: latest stable after install
vite-plugin-node-polyfills: 0.17.0
```

Install command:

```powershell
npm install buffer vite-plugin-node-polyfills@0.17.0
```

Reason:

```txt
The official NoirJS browser tutorial includes buffer and vite-plugin-node-polyfills@0.17.0.
```

Record installed version after install:

```powershell
npm list buffer vite-plugin-node-polyfills
```

---

## 9. Barretenberg CLI / bb CLI

Selected tool:

```txt
bb CLI
```

Install method:

```powershell
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
bbup
```

Important:

```txt
The exact bb CLI version must be checked after installation.
```

Verify:

```powershell
bb --version
```

Record here after install:

```txt
bb CLI version: TODO_AFTER_INSTALL
```

Compatibility rule:

```txt
bb CLI must be compatible with the selected Nargo/Noir artifact.
If bb CLI cannot verify a proof produced by the selected toolchain, stop and resolve versions before continuing.
```

---

## 10. Vite

Selected tool:

```txt
Vite
```

Install strategy:

```txt
Use create-vite latest for scaffolding.
Record the installed version after project creation.
```

Create app command:

```powershell
npm create vite@latest app -- --template react-ts
cd app
npm install
```

Record after install:

```powershell
npm list vite
```

Current target:

```txt
Vite 8.x or current version installed by create-vite
```

Reason:

```txt
Nimiq Mini App documentation uses Vite examples.
The project does not need advanced Vite features; it only needs React, TypeScript, dev server host access, and WASM compatibility.
```

---

## 11. React

Selected framework:

```txt
React
```

Install strategy:

```txt
Installed by Vite react-ts template.
Record exact version after scaffold.
```

Record after install:

```powershell
npm list react react-dom
```

Record here after scaffold:

```txt
react: TODO_AFTER_SCAFFOLD
react-dom: TODO_AFTER_SCAFFOLD
```

---

## 12. TypeScript

Selected tool:

```txt
TypeScript
```

Install strategy:

```txt
Installed by Vite react-ts template.
Record exact version after scaffold.
```

Record after install:

```powershell
npm list typescript
```

Record here after scaffold:

```txt
typescript: TODO_AFTER_SCAFFOLD
```

---

## 13. Nimiq Mini App SDK

Selected package:

```txt
@nimiq/mini-app-sdk
```

Install command:

```powershell
npm install @nimiq/mini-app-sdk
```

Record installed version:

```powershell
npm list @nimiq/mini-app-sdk
```

Record here after install:

```txt
@nimiq/mini-app-sdk: TODO_AFTER_INSTALL
```

Reason:

```txt
The official Nimiq Mini App tutorial installs the published SDK using npm install @nimiq/mini-app-sdk.
```

Provider init pattern:

```ts
import { init } from '@nimiq/mini-app-sdk'

const nimiq = await init()
```

---

## 14. QR tooling

Selected package:

```txt
qr-scanner
```

Selected version:

```txt
1.4.2
```

Install command:

```powershell
npm install qr-scanner@1.4.2
```

Reason:

```txt
qr-scanner is maintained under the Nimiq GitHub organization and is suitable for browser QR scanning.
```

Optional QR generation package:

```txt
qrcode
```

Install command:

```powershell
npm install qrcode
npm install -D @types/qrcode
```

Record installed version:

```powershell
npm list qrcode @types/qrcode
```

Record here:

```txt
qrcode: TODO_AFTER_INSTALL
@types/qrcode: TODO_AFTER_INSTALL
```

---

## 15. EVM interaction library

Selected package:

```txt
viem
```

Install command:

```powershell
npm install viem
```

Reason:

```txt
viem works well for typed EVM calls and eth_call style interactions.
```

Record installed version:

```powershell
npm list viem
```

Record here:

```txt
viem: TODO_AFTER_INSTALL
```

Fallback option:

```txt
ethers
```

Do not install ethers unless viem creates compatibility issues.

---

## 16. Solidity deployment tooling

Decision status:

```txt
PENDING
```

Reason:

```txt
Do not choose Hardhat or Foundry until Verifier.sol is generated and inspected.
```

Options:

```txt
Hardhat + viem/ethers
Foundry
```

Temporary recommendation:

```txt
Use Hardhat if the project stays mostly TypeScript.
Use Foundry if the generated Verifier.sol is easier to compile/test with forge.
```

Record decision later:

```txt
Deployment tool: TODO_AFTER_VERIFIER_GENERATED
```

---

## 17. EVM verifier network

Selected initial network:

```txt
Sepolia
```

Chain ID:

```txt
11155111
```

Reason:

```txt
Sepolia is widely supported as an Ethereum testnet and is suitable for deploying an MVP verifier contract.
```

SafePay field:

```txt
evmVerifierChainId = 11155111
```

Note:

```txt
This is separate from the Nimiq payment network.
Do not use a single generic chain_id.
```

---

## 18. Nimiq payment network

Selected initial network:

```txt
TestAlbatross
```

SafePay field:

```txt
nimiqNetworkId = "TestAlbatross"
```

Human-readable payload field:

```txt
network = "nimiq-testnet"
```

Production future:

```txt
MainAlbatross
```

Important:

```txt
Do not mix TestAlbatross and MainAlbatross intents.
The intentHash must include nimiqNetworkId.
```

---

## 19. SafePay fixed constants

Domain separator:

```txt
SAFEPAY-ZK-V1
```

Payload version:

```txt
safepay-zk-v1
```

Payment intent type:

```txt
nim-payment-intent
```

NIM transaction data prefix:

```txt
safepay:v1:
```

Full NIM transaction data format:

```txt
safepay:v1:<intentHash>
```

UI proof text:

```txt
✅ ZK proof valid
```

Do not change this UI text without updating the demo script.

---

## 20. First install commands

### 20.1 Create root folders

```powershell
mkdir nimiq-safepay-zk
cd nimiq-safepay-zk
mkdir docs
mkdir circuits
mkdir contracts
```

### 20.2 Install Nargo

```powershell
noirup -v 1.0.0-beta.20
nargo --version
```

### 20.3 Create hello_world Noir PoC

```powershell
cd circuits
nargo new hello_world
cd hello_world
nargo check
nargo compile
nargo execute
```

### 20.4 Create frontend app

```powershell
cd ../../
npm create vite@latest app -- --template react-ts
cd app
npm install
```

### 20.5 Install ZK browser dependencies

```powershell
npm install @noir-lang/noir_js@1.0.0-beta.20 @aztec/bb.js@3.0.0-nightly.20251104 buffer vite-plugin-node-polyfills@0.17.0
```

### 20.6 Install Nimiq Mini App SDK

```powershell
npm install @nimiq/mini-app-sdk
```

### 20.7 Install QR and EVM helpers

```powershell
npm install qr-scanner@1.4.2 qrcode viem
npm install -D @types/qrcode
```

### 20.8 Run local dev server

```powershell
npm run dev -- --host
```

---

## 21. Verification commands

Run these commands and paste outputs into this file.

### 21.1 System

```powershell
node -v
npm -v
```

Output:

```txt
node: TODO
npm: TODO
```

### 21.2 Nargo

```powershell
nargo --version
```

Output:

```txt
nargo: TODO
```

### 21.3 bb CLI

```powershell
bb --version
```

Output:

```txt
bb: TODO
```

### 21.4 Frontend packages

From `app/`:

```powershell
npm list @noir-lang/noir_js @aztec/bb.js @nimiq/mini-app-sdk vite typescript react react-dom qr-scanner qrcode viem
```

Output:

```txt
TODO
```

---

## 22. Compatibility checkpoints

Do not continue to `payment_intent_match` until all checkpoints pass.

```txt
[ ] nargo 1.0.0-beta.20 is installed.
[ ] hello_world compiles with nargo.
[ ] hello_world executes with nargo.
[ ] Vite React app starts.
[ ] NoirJS and bb.js packages install successfully.
[ ] The frontend can import @noir-lang/noir_js.
[ ] The frontend can import @aztec/bb.js.
[ ] @nimiq/mini-app-sdk installs successfully.
[ ] Local dev server runs with --host.
```

---

## 23. Notes

### 23.1 Why not latest for all ZK packages?

Because the ZK stack is version-sensitive.

Use the documented compatible versions first:

```txt
nargo 1.0.0-beta.20
@noir-lang/noir_js 1.0.0-beta.20
@aztec/bb.js 3.0.0-nightly.20251104
```

After the MVP works, upgrades can be tested in a separate branch.

### 23.2 Why npm?

Because the Nimiq Mini App documentation uses npm commands, and npm keeps the first setup simple.

### 23.3 Why Sepolia first?

Because the MVP verifier only needs a standard EVM testnet for `eth_call`.

### 23.4 Why TestAlbatross first?

Because the MVP should never use real mainnet funds during development.

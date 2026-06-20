import fs from 'node:fs'
import path from 'node:path'
import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js'

const appDir = process.cwd()
const projectRoot = path.join(appDir, '..')
const contractsDir = path.join(projectRoot, 'contracts')

const artifactPath = path.join(
  appDir,
  'public',
  'circuits',
  'payment_intent_match.json'
)

const vkPath = path.join(
  contractsDir,
  'payment_intent_vk.bin'
)

const verifierPath = path.join(
  contractsDir,
  'PaymentIntentVerifier.sol'
)

fs.mkdirSync(contractsDir, { recursive: true })

console.log('Loading circuit artifact...')
console.log('Artifact path:', artifactPath)

const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))

console.log('Circuit noir_version:', circuit.noir_version)
console.log('Circuit bytecode type:', typeof circuit.bytecode)
console.log('Circuit bytecode length:', circuit.bytecode.length)

console.log('\nInitializing Barretenberg...')
const api = await Barretenberg.new()
const backend = new UltraHonkBackend(circuit.bytecode, api)
console.log('Backend initialized.')

console.log('\nGenerating verification key...')
const vk = await backend.getVerificationKey()
console.log('VK size:', vk.length, 'bytes')

fs.writeFileSync(vkPath, vk)
console.log('VK saved to:', vkPath)

console.log('\nGenerating Solidity verifier...')
const verifierCode = await backend.getSolidityVerifier(vk)
console.log('Verifier code length:', verifierCode.length, 'chars')

fs.writeFileSync(verifierPath, verifierCode)
console.log('Verifier saved to:', verifierPath)

if (typeof backend.destroy === 'function') {
  await backend.destroy()
}

console.log('\n✅ Done. Solidity verifier generated successfully.')

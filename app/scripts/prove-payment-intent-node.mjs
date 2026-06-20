import fs from 'node:fs'
import path from 'node:path'
import { Noir } from '@noir-lang/noir_js'
import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js'

const artifactPath = path.join(
  process.cwd(),
  'public',
  'circuits',
  'payment_intent_match.json'
)

const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))

console.log('Circuit noir_version:', circuit.noir_version)
console.log('Circuit bytecode type:', typeof circuit.bytecode)
console.log('Circuit bytecode length:', circuit.bytecode.length)

console.log('Initializing Barretenberg...')
const api = await Barretenberg.new()
const backend = new UltraHonkBackend(circuit.bytecode, api)
console.log('Barretenberg initialized.')

const noir = new Noir(circuit)

const inputs = {
  intent_hash: '0x1a93a6e2a1063e612c60c258557c286c33366e640ab4a44f4342042fc379da56',
  nullifier: '0x0e8cb331ce76e2b62720a36ccbbd4f816baf7ce2b25aa307afabbcedf04e9f0c',

  domain_separator: '1001',
  nimiq_network_id: '2001',
  evm_verifier_chain_id: '11155111',
  version_field: '1',
  type_field: '3001',
  network_field: '4001',
  recipient_field: '5001',
  amount_luna: '2500000',
  memo_secret_hash_field: '6001',
  expires_at: '1780000000',
  nonce_field: '7001',
  salt_field: '8001',
  secret_field: '9001',
}

console.log('Executing payment_intent_match circuit...')
const { witness } = await noir.execute(inputs)

console.log('Witness constructor:', witness.constructor.name)
console.log('Witness length:', witness.length)
console.log('Witness first bytes:', Array.from(witness.slice(0, 8)))

console.log('Generating proof...')
const proof = await backend.generateProof(witness)

console.log('Proof generated.')
console.log('Proof size:', proof.proof.length)
console.log('Public inputs:', proof.publicInputs)

console.log('Verifying proof...')
const verified = await backend.verifyProof(proof)

console.log('Proof verified:', verified)

if (typeof backend.destroy === 'function') {
  await backend.destroy()
}

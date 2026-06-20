import fs from 'node:fs'
import path from 'node:path'
import { Noir } from '@noir-lang/noir_js'
import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js'

const artifactPath = path.join(process.cwd(), 'public', 'circuits', 'hello_world.json')
const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))

console.log('Circuit noir_version:', circuit.noir_version)
console.log('Circuit bytecode type:', typeof circuit.bytecode)
console.log('Circuit bytecode length:', circuit.bytecode.length)

const noir = new Noir(circuit)

// Crear instancia de Barretenberg PRIMERO
console.log('Initializing Barretenberg...')
const api = await Barretenberg.new()
console.log('Barretenberg initialized.')

// Pasar la instancia de Barretenberg al backend
const backend = new UltraHonkBackend(circuit.bytecode, api)

const inputs = {
  x: '1',
  y: '2',
}

console.log('Executing Noir circuit...')
const { witness } = await noir.execute(inputs)

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


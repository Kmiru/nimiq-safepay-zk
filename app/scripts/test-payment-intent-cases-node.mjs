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

const validInputs = {
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

function cloneInputs(overrides = {}) {
  return {
    ...validInputs,
    ...overrides,
  }
}

async function runExpectedPassCase(noir, backend) {
  console.log('\n✅ Case 1: valid payment intent should pass')

  const { witness } = await noir.execute(validInputs)
  const proof = await backend.generateProof(witness)
  const verified = await backend.verifyProof(proof)

  if (!verified) {
    throw new Error('Expected valid proof to verify, but verification returned false.')
  }

  console.log('Result: proof generated and verified successfully.')
}

async function runExpectedFailCase(noir, name, inputs) {
  console.log(`\n❌ ${name}`)

  try {
    await noir.execute(inputs)
    throw new Error('Expected circuit execution to fail, but it passed.')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('Expected circuit execution to fail')) {
      throw error
    }

    console.log('Result: circuit rejected the tampered input as expected.')
    console.log(`Reason: ${message.split('\n')[0]}`)
  }
}

async function main() {
  console.log('Circuit noir_version:', circuit.noir_version)
  console.log('Circuit bytecode length:', circuit.bytecode.length)

  const noir = new Noir(circuit)

  console.log('Initializing Barretenberg...')
  const api = await Barretenberg.new()
  const backend = new UltraHonkBackend(circuit.bytecode, api)
  console.log('Barretenberg initialized.')

  await runExpectedPassCase(noir, backend)

  await runExpectedFailCase(
    noir,
    'Case 2: tampered amount_luna should fail',
    cloneInputs({
      amount_luna: '9999999',
    })
  )

  await runExpectedFailCase(
    noir,
    'Case 3: tampered recipient_field should fail',
    cloneInputs({
      recipient_field: '9999',
    })
  )

  await runExpectedFailCase(
    noir,
    'Case 4: tampered nimiq_network_id should fail',
    cloneInputs({
      nimiq_network_id: '9999',
    })
  )

  await runExpectedFailCase(
    noir,
    'Case 5: tampered evm_verifier_chain_id should fail',
    cloneInputs({
      evm_verifier_chain_id: '1',
    })
  )

  await runExpectedFailCase(
    noir,
    'Case 6: tampered nullifier should fail',
    cloneInputs({
      nullifier: '12345',
    })
  )

  await runExpectedFailCase(
    noir,
    'Case 7: tampered secret_field should fail',
    cloneInputs({
      secret_field: '12345',
    })
  )

  console.log('\nAll payment intent tests passed.')

  if (typeof backend.destroy === 'function') {
    await backend.destroy()
  }
}

main().catch((error) => {
  console.error('\nTest suite failed.')
  console.error(error)
  process.exit(1)
})

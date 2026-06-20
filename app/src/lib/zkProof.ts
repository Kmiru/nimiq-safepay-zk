import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'
import initACVM from '@noir-lang/acvm_js'
import initNoirC from '@noir-lang/noirc_abi'

import acvmUrl from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url'
import noircUrl from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url'

import type { PaymentIntentInputs } from './paymentIntentInputs'

type ProofResult = {
  proof: Uint8Array
  publicInputs: string[]
  proofSize: number
  verified: boolean
}

let wasmInitialized = false

async function initNoirWasm() {
  if (wasmInitialized) {
    return
  }

  await Promise.all([
    initACVM(fetch(acvmUrl)),
    initNoirC(fetch(noircUrl)),
  ])

  wasmInitialized = true
}

export async function generateAndVerifyPaymentIntentProof(
  inputs: PaymentIntentInputs
): Promise<ProofResult> {
  await initNoirWasm()

  const artifactResponse = await fetch(
  `${import.meta.env.BASE_URL}circuits/payment_intent_match.json`
)

  if (!artifactResponse.ok) {
    throw new Error(
      `Failed to load payment_intent_match artifact: ${artifactResponse.status} ${artifactResponse.statusText}`
    )
  }

  const circuit = await artifactResponse.json()

  const noir = new Noir(circuit)

  const api = await Barretenberg.new()
  const backend = new UltraHonkBackend(circuit.bytecode, api)

  const { witness } = await noir.execute(inputs)

  const proofData = await backend.generateProof(witness)
  const verified = await backend.verifyProof(proofData)

  const maybeDestroyableBackend = backend as unknown as {
  destroy?: () => Promise<void>
}

if (typeof maybeDestroyableBackend.destroy === 'function') {
  await maybeDestroyableBackend.destroy()
}

  return {
    proof: proofData.proof,
    publicInputs: proofData.publicInputs,
    proofSize: proofData.proof.length,
    verified,
  }
}

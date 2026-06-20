import fs from 'node:fs'
import path from 'node:path'

import { demoHumanSafePayPayload } from '../src/lib/humanSafePayPayload.ts'
import { humanPayloadToCircuitPayload } from '../src/lib/humanPayloadToCircuitPayload.ts'

const appDir = process.cwd()
const projectRoot = path.join(appDir, '..')

const calculatorProverPath = path.join(
  projectRoot,
  'circuits',
  'payment_intent_poseidon_calculator',
  'Prover.toml'
)

const circuitPayload = humanPayloadToCircuitPayload(demoHumanSafePayPayload)

const toml = `domain_separator = "${circuitPayload.domainSeparator}"
nimiq_network_id = "${circuitPayload.nimiqNetworkId}"
evm_verifier_chain_id = "${circuitPayload.evmVerifierChainId}"
version_field = "${circuitPayload.version}"
type_field = "${circuitPayload.type}"
network_field = "${circuitPayload.network}"
recipient_field = "${circuitPayload.recipient}"
amount_luna = "${circuitPayload.amountLuna}"
memo_secret_hash_field = "${circuitPayload.memoSecretHash}"
expires_at = "${circuitPayload.expiresAt}"
nonce_field = "${circuitPayload.nonce}"
salt_field = "${circuitPayload.salt}"
secret_field = "${circuitPayload.secret}"
`

fs.writeFileSync(calculatorProverPath, toml)

console.log('Wrote calculator Prover.toml:')
console.log(calculatorProverPath)
console.log('')
console.log(toml)

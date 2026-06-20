import fs from 'node:fs'
import path from 'node:path'

import { demoHumanSafePayPayload } from '../src/lib/humanSafePayPayload.ts'
import { humanPayloadToCircuitPayload } from '../src/lib/humanPayloadToCircuitPayload.ts'
import { buildCircuitInputsFromPayload } from '../src/lib/intentHash.ts'

const appDir = process.cwd()
const projectRoot = path.join(appDir, '..')

const matchProverPath = path.join(
  projectRoot,
  'circuits',
  'payment_intent_match',
  'Prover.toml'
)

const circuitPayload = humanPayloadToCircuitPayload(demoHumanSafePayPayload)
const inputs = buildCircuitInputsFromPayload(circuitPayload)

const toml = `intent_hash = "${inputs.intent_hash}"
nullifier = "${inputs.nullifier}"

domain_separator = "${inputs.domain_separator}"
nimiq_network_id = "${inputs.nimiq_network_id}"
evm_verifier_chain_id = "${inputs.evm_verifier_chain_id}"
version_field = "${inputs.version_field}"
type_field = "${inputs.type_field}"
network_field = "${inputs.network_field}"
recipient_field = "${inputs.recipient_field}"
amount_luna = "${inputs.amount_luna}"
memo_secret_hash_field = "${inputs.memo_secret_hash_field}"
expires_at = "${inputs.expires_at}"
nonce_field = "${inputs.nonce_field}"
salt_field = "${inputs.salt_field}"
secret_field = "${inputs.secret_field}"
`

fs.writeFileSync(matchProverPath, toml)

console.log('Wrote payment_intent_match Prover.toml:')
console.log(matchProverPath)
console.log('')
console.log(toml)
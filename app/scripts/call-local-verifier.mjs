import fs from 'node:fs'
import path from 'node:path'
import { createPublicClient, http } from 'viem'

const verifierAddress = process.env.VERIFIER_ADDRESS

if (!verifierAddress) {
  throw new Error(
    'Missing VERIFIER_ADDRESS. Example: VERIFIER_ADDRESS=0x... node scripts/call-local-verifier.mjs'
  )
}

const appDir = process.cwd()
const projectRoot = path.join(appDir, '..')

const abiPath = path.join(
  projectRoot,
  'out',
  'PaymentIntentVerifier.sol',
  'HonkVerifier.json'
)

const proofPath = path.join(
  projectRoot,
  'circuits',
  'payment_intent_match',
  'target',
  'proof'
)

const publicInputsPath = path.join(
  projectRoot,
  'circuits',
  'payment_intent_match',
  'target',
  'public_inputs'
)

const verifierArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'))

const proofBytes = fs.readFileSync(proofPath)
const publicInputsBytes = fs.readFileSync(publicInputsPath)

if (publicInputsBytes.length % 32 !== 0) {
  throw new Error(`Invalid public_inputs length: ${publicInputsBytes.length}`)
}

const proof = `0x${proofBytes.toString('hex')}`

const publicInputs = []

for (let i = 0; i < publicInputsBytes.length; i += 32) {
  publicInputs.push(`0x${publicInputsBytes.subarray(i, i + 32).toString('hex')}`)
}

const anvilLocal = {
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
}

const client = createPublicClient({
  chain: anvilLocal,
  transport: http('http://127.0.0.1:8545'),
})

console.log('Verifier address:', verifierAddress)
console.log('Proof bytes:', proofBytes.length)
console.log('Public inputs bytes:', publicInputsBytes.length)
console.log('Public inputs count:', publicInputs.length)
console.log('Public inputs:', publicInputs)

const verified = await client.readContract({
  address: verifierAddress,
  abi: verifierArtifact.abi,
  functionName: 'verify',
  args: [proof, publicInputs],
})

console.log('Verifier result:', verified)

if (verified !== true) {
  throw new Error('Proof did not verify on local Anvil verifier.')
}

console.log('✅ Local Anvil verifier call succeeded.')

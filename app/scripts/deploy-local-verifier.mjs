import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const appDir = process.cwd()
const projectRoot = path.join(appDir, '..')

const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545'
const privateKey =
  process.env.PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const verifierSource = 'contracts/PaymentIntentVerifier.sol'
const transcriptLibName = `${verifierSource}:ZKTranscriptLib`
const honkVerifierName = `${verifierSource}:HonkVerifier`

function runCommand(command, args, options = {}) {
  console.log('')
  console.log(`$ ${command} ${args.join(' ')}`)
  console.log('')

  const result = spawnSync(command, args, {
    cwd: options.cwd || projectRoot,
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    encoding: 'utf8',
  })

  const output = `${result.stdout || ''}${result.stderr || ''}`

  if (output.trim()) {
    console.log(output.trim())
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`)
  }

  return output
}

function extractDeployedAddress(output, label) {
  const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/)

  if (!match) {
    throw new Error(`Could not find deployed address for ${label}`)
  }

  return match[1]
}

function writeLocalVerifierConfig(honkVerifierAddress) {
  const configPath = path.join(appDir, 'src', 'config', 'localVerifier.ts')

  const content = `import type { Address } from 'viem'

export const LOCAL_HONK_VERIFIER_ADDRESS =
  '${honkVerifierAddress}' as Address
`

  fs.writeFileSync(configPath, content)

  console.log('')
  console.log('Updated local verifier config:')
  console.log(configPath)
  console.log('')
  console.log(`LOCAL_HONK_VERIFIER_ADDRESS=${honkVerifierAddress}`)
}

console.log('Nimiq SafePay ZK — Local verifier deploy')
console.log('')
console.log(`Project root: ${projectRoot}`)
console.log(`App dir:      ${appDir}`)
console.log(`RPC URL:      ${rpcUrl}`)

console.log('')
console.log('Deploying ZKTranscriptLib...')

const libraryOutput = runCommand('forge', [
  'create',
  transcriptLibName,
  '--rpc-url',
  rpcUrl,
  '--private-key',
  privateKey,
  '--broadcast',
])

const transcriptLibAddress = extractDeployedAddress(
  libraryOutput,
  'ZKTranscriptLib'
)

console.log('')
console.log(`ZKTranscriptLib deployed at: ${transcriptLibAddress}`)

console.log('')
console.log('Deploying HonkVerifier...')

const verifierOutput = runCommand('forge', [
  'create',
  honkVerifierName,
  '--rpc-url',
  rpcUrl,
  '--private-key',
  privateKey,
  '--libraries',
  `${transcriptLibName}:${transcriptLibAddress}`,
  '--broadcast',
])

const honkVerifierAddress = extractDeployedAddress(
  verifierOutput,
  'HonkVerifier'
)

console.log('')
console.log(`HonkVerifier deployed at: ${honkVerifierAddress}`)

console.log('')
console.log('Checking deployed bytecode...')

const deployedCode = runCommand('cast', [
  'code',
  honkVerifierAddress,
  '--rpc-url',
  rpcUrl,
])

if (deployedCode.trim() === '0x') {
  throw new Error('HonkVerifier deployment check failed: no bytecode found.')
}

console.log('')
console.log('Bytecode found.')

writeLocalVerifierConfig(honkVerifierAddress)

console.log('')
console.log('Testing local verifier call...')

runCommand(
  'node',
  ['scripts/call-local-verifier.mjs'],
  {
    cwd: appDir,
    env: {
      VERIFIER_ADDRESS: honkVerifierAddress,
    },
  }
)

console.log('')
console.log('✅ Local verifier deployment completed successfully.')
console.log('')
console.log('Next:')
console.log('rm -rf node_modules/.vite')
console.log('npm run dev -- --host 0.0.0.0')

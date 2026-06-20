import fs from 'node:fs'
import path from 'node:path'

const verifierAddress = process.argv[2]

if (!verifierAddress) {
  console.error('Missing verifier address.')
  console.error('')
  console.error('Usage:')
  console.error('node scripts/update-local-verifier-config.mjs 0xHONK_VERIFIER_ADDRESS')
  process.exit(1)
}

if (!/^0x[a-fA-F0-9]{40}$/.test(verifierAddress)) {
  console.error(`Invalid Ethereum address: ${verifierAddress}`)
  process.exit(1)
}

const configPath = path.join(
  process.cwd(),
  'src',
  'config',
  'localVerifier.ts'
)

const content = `import type { Address } from 'viem'

export const LOCAL_HONK_VERIFIER_ADDRESS =
  '${verifierAddress}' as Address
`

fs.writeFileSync(configPath, content)

console.log('Updated local verifier config:')
console.log(configPath)
console.log('')
console.log(`LOCAL_HONK_VERIFIER_ADDRESS=${verifierAddress}`)

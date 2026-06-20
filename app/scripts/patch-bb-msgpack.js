import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = [
  'node_modules/@aztec/bb.js/dest/browser/cbind/generated/async.js',
  'node_modules/@aztec/bb.js/dest/node/cbind/generated/async.js',
]

let patched = 0

for (const relative of files) {
  const file = path.join(root, relative)

  if (!fs.existsSync(file)) {
    console.log(`Missing: ${relative}`)
    continue
  }

  let source = fs.readFileSync(file, 'utf8')
  const original = source

  source = source.replace(
    'new Decoder({ useRecords: false }).unpack(encodedResult)',
    'new Decoder({ useRecords: false, maxBinLength: 268435456, maxStrLength: 268435456, maxArrayLength: 268435456, maxMapLength: 268435456 }).unpack(encodedResult)'
  )

  if (source !== original) {
    fs.writeFileSync(file, source)
    patched += 1
    console.log(`Patched: ${relative}`)
  } else {
    console.log(`No match found in: ${relative}`)
  }
}

console.log(`Done. Patched ${patched}/${files.length} files.`)

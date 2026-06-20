import type { Hex } from 'viem'

async function fetchBinaryAsHex(path: string): Promise<Hex> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as Hex
}

function splitHexIntoBytes32Array(hex: Hex): Hex[] {
  const cleanHex = hex.slice(2)

  if (cleanHex.length % 64 !== 0) {
    throw new Error(`Invalid public inputs hex length: ${cleanHex.length}`)
  }

  const publicInputs: Hex[] = []

  for (let i = 0; i < cleanHex.length; i += 64) {
    publicInputs.push(`0x${cleanHex.slice(i, i + 64)}` as Hex)
  }

  return publicInputs
}

export async function loadEvmProofFiles(): Promise<{
  proof: Hex
  publicInputs: Hex[]
}> {
  const proof = await fetchBinaryAsHex(
  `${import.meta.env.BASE_URL}evm-test/proof.bin`
)

const publicInputsHex = await fetchBinaryAsHex(
  `${import.meta.env.BASE_URL}evm-test/public_inputs.bin`
)

  return {
    proof,
    publicInputs: splitHexIntoBytes32Array(publicInputsHex),
  }
}

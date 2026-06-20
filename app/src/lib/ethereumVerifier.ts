import { createPublicClient, http, type Address, type Hex } from 'viem'

type VerifyPaymentIntentProofParams = {
  verifierAddress: Address
  proof: Hex
  publicInputs: Hex[]
  rpcUrl?: string
}

function getDefaultLocalRpcUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8545'
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8545'
  }

  return `http://${hostname}:8545`
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
      http: [getDefaultLocalRpcUrl()],
    },
  },
} as const

const honkVerifierAbi = [
  {
    type: 'function',
    name: 'verify',
    stateMutability: 'view',
    inputs: [
      {
        name: '_proof',
        type: 'bytes',
      },
      {
        name: '_publicInputs',
        type: 'bytes32[]',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
] as const

export async function verifyPaymentIntentProofOnEvm({
  verifierAddress,
  proof,
  publicInputs,
  rpcUrl = getDefaultLocalRpcUrl(),
}: VerifyPaymentIntentProofParams): Promise<boolean> {
  const client = createPublicClient({
    chain: anvilLocal,
    transport: http(rpcUrl),
  })

  const verified = await client.readContract({
    address: verifierAddress,
    abi: honkVerifierAbi,
    functionName: 'verify',
    args: [proof, publicInputs],
  })

  return verified
}
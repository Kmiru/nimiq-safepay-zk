export type HumanSafePayPayload = {
  domainSeparator: string
  nimiqNetworkId: string
  evmVerifierChainId: number
  version: string
  type: string
  network: string
  recipient: string
  amountNim: string
  memoSecretHash: string
  expiresAt: number
  nonce: string
  salt: string
  secret: string
}

export const demoHumanSafePayPayload: HumanSafePayPayload = {
  domainSeparator: 'SAFEPAY-ZK-V1',
  nimiqNetworkId: 'TestAlbatross',
  evmVerifierChainId: 31337,
  version: 'safepay-zk-v1',
  type: 'nim-payment-intent',
  network: 'nimiq-testnet',
  recipient: 'NQ92 RF5K UGHG 00CB JJ3C 4YKA UX6S GV59 4B2E',
  amountNim: '25',
  memoSecretHash:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  expiresAt: 1893456000,
  nonce:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  salt:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  secret:
    '0x0000000000000000000000000000000000000000000000000000000000000002',
}

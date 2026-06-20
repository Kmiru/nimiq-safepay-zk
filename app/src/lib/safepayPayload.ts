export type SafePayPayload = {
  domainSeparator: string
  nimiqNetworkId: string
  evmVerifierChainId: string
  version: string
  type: string
  network: string
  recipient: string
  amountLuna: string
  memoSecretHash: string
  expiresAt: string
  nonce: string
  salt: string
  secret: string
}

export const demoSafePayPayload: SafePayPayload = {
  domainSeparator: '1001',
  nimiqNetworkId: '2001',
  evmVerifierChainId: '11155111',
  version: '1',
  type: '3001',
  network: '4001',
  recipient: '5001',
  amountLuna: '2500000',
  memoSecretHash: '6001',
  expiresAt: '1780000000',
  nonce: '7001',
  salt: '8001',
  secret: '9001',
}

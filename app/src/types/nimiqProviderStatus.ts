export type NimiqProviderStatus = {
  connecting: boolean
  connected: boolean
  account: string | null
  consensusEstablished: boolean
  blockNumber: number | null
  error: string | null
}

export function createInitialNimiqProviderStatus(): NimiqProviderStatus {
  return {
    connecting: false,
    connected: false,
    account: null,
    consensusEstablished: false,
    blockNumber: null,
    error: null,
  }
}

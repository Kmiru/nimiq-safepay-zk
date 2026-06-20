export type EvmStatus = {
  loading: boolean
  verified: boolean | null
  error: string | null
}

export function createInitialEvmStatus(): EvmStatus {
  return {
    loading: false,
    verified: null,
    error: null,
  }
}
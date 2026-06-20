export type NimiqPaymentStatus = {
  sending: boolean
  sent: boolean
  transactionHash: string | null
  error: string | null
}

export function createInitialNimiqPaymentStatus(): NimiqPaymentStatus {
  return {
    sending: false,
    sent: false,
    transactionHash: null,
    error: null,
  }
}

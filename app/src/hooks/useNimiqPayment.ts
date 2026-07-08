import { useState } from 'react'
import { init } from '@nimiq/mini-app-sdk'

import type { PaymentReview } from '../lib/paymentReview'
import { nimToLunaString } from '../lib/canonicalFields'
import { intentHashToCompactData } from '../lib/safePayIntentData'
import {
  createInitialNimiqPaymentStatus,
  type NimiqPaymentStatus,
} from '../types/nimiqPaymentStatus'

type NimiqProvider = Awaited<ReturnType<typeof init>>

type SendPaymentParams = {
  paymentReview: PaymentReview
  intentHash: string | null | undefined
  getProvider: () => NimiqProvider | null
}

function isDummyRecipient(recipient: string): boolean {
  return recipient.replaceAll(' ', '') === 'NQ000000000000000000000000000000000000'
}

function getProviderErrorMessage(value: unknown, fallback: string): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message
  }

  if (typeof value === 'object' && value !== null && 'error' in value) {
    const errorValue = value.error

    if (typeof errorValue === 'string') {
      return errorValue
    }

    if (
      typeof errorValue === 'object' &&
      errorValue !== null &&
      'message' in errorValue &&
      typeof errorValue.message === 'string'
    ) {
      return errorValue.message
    }
  }

  return fallback
}

export function useNimiqPayment() {
  const [paymentStatus, setPaymentStatus] = useState<NimiqPaymentStatus>(
    createInitialNimiqPaymentStatus()
  )

  function resetPaymentStatus() {
    setPaymentStatus(createInitialNimiqPaymentStatus())
  }

  async function sendPayment({
    paymentReview,
    intentHash,
    getProvider,
  }: SendPaymentParams): Promise<string | null> {
    try {
      setPaymentStatus({
        sending: true,
        sent: false,
        transactionHash: null,
        error: null,
      })

      const provider = getProvider()

      if (!provider) {
        throw new Error('Connect Nimiq Pay before sending payment.')
      }

      if (paymentReview.isExpired) {
        throw new Error('This payment request has expired. Ask for a new request.')
      }

      if (isDummyRecipient(paymentReview.recipient)) {
        throw new Error(
          'This recipient is not a real Nimiq address. Replace it with a valid recipient before sending payment.'
        )
      }

      const value = Number(nimToLunaString(paymentReview.amountNim))

      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`Invalid payment amount: ${paymentReview.amountNim} NIM`)
      }

      const data = intentHashToCompactData(intentHash)

      const transactionResult = await provider.sendBasicTransactionWithData({
        recipient: paymentReview.recipient,
        value,
        data,
      })

      if (typeof transactionResult !== 'string') {
        throw new Error(
          getProviderErrorMessage(
            transactionResult,
            'Nimiq Pay did not return a transaction hash.'
          )
        )
      }

      setPaymentStatus({
        sending: false,
        sent: true,
        transactionHash: transactionResult,
        error: null,
      })

      return transactionResult
    } catch (error) {
      console.error('Nimiq payment failed:', error)

      setPaymentStatus({
        sending: false,
        sent: false,
        transactionHash: null,
        error: error instanceof Error ? error.message : String(error),
      })

      return null
    }
  }

  return {
    paymentStatus,
    resetPaymentStatus,
    sendPayment,
  }
}
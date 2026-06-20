import { useState } from 'react'
import type { Address } from 'viem'

import { paymentIntentInputs } from '../lib/paymentIntentInputs'
import { generateAndVerifyPaymentIntentProof } from '../lib/zkProof'
import { loadEvmProofFiles } from '../lib/evmProofFiles'
import { verifyPaymentIntentProofOnEvm } from '../lib/ethereumVerifier'
import {
  createInitialProofStatus,
  type ProofStatus,
} from '../types/proofStatus'
import {
  createInitialEvmStatus,
  type EvmStatus,
} from '../types/evmStatus'

type UseSafePayVerificationParams = {
  verifierAddress: Address
}

export function useSafePayVerification({
  verifierAddress,
}: UseSafePayVerificationParams) {
  const [status, setStatus] = useState<ProofStatus>(createInitialProofStatus())
  const [evmStatus, setEvmStatus] = useState<EvmStatus>(createInitialEvmStatus())

  function resetZkAndEvmStatus() {
    setStatus(createInitialProofStatus())
    setEvmStatus(createInitialEvmStatus())
  }

  async function runPaymentIntentProof(): Promise<boolean> {
    try {
      setStatus(createInitialProofStatus())

      const result = await generateAndVerifyPaymentIntentProof(paymentIntentInputs)

      setStatus({
        importsLoaded: true,
        artifactLoaded: true,
        witnessGenerated: true,
        proofGenerated: true,
        proofVerified: result.verified,
        proofSize: result.proofSize,
        publicInputs: result.publicInputs,
        error: null,
      })

      return result.verified === true
    } catch (error) {
      console.error(error)

      setStatus((previousStatus) => ({
        ...previousStatus,
        error: error instanceof Error ? error.message : String(error),
      }))

      return false
    }
  }

  async function verifyOnLocalEvm(): Promise<boolean> {
    try {
      setEvmStatus({
        loading: true,
        verified: null,
        error: null,
      })

      const { proof, publicInputs } = await loadEvmProofFiles()

      const verified = await verifyPaymentIntentProofOnEvm({
        verifierAddress,
        proof,
        publicInputs,
      })

      setEvmStatus({
        loading: false,
        verified,
        error: null,
      })

      return verified === true
    } catch (error) {
      console.error(error)

      setEvmStatus({
        loading: false,
        verified: null,
        error: error instanceof Error ? error.message : String(error),
      })

      return false
    }
  }

  return {
    status,
    evmStatus,
    resetZkAndEvmStatus,
    runPaymentIntentProof,
    verifyOnLocalEvm,
  }
}

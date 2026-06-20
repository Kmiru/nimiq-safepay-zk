export type ProofStatus = {
  importsLoaded: boolean
  artifactLoaded: boolean
  witnessGenerated: boolean
  proofGenerated: boolean
  proofVerified: boolean
  proofSize: number | null
  publicInputs: string[]
  error: string | null
}

export function createInitialProofStatus(): ProofStatus {
  return {
    importsLoaded: false,
    artifactLoaded: false,
    witnessGenerated: false,
    proofGenerated: false,
    proofVerified: false,
    proofSize: null,
    publicInputs: [],
    error: null,
  }
}
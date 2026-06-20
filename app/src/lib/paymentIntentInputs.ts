import { demoHumanSafePayPayload } from './humanSafePayPayload'
import { humanPayloadToCircuitPayload } from './humanPayloadToCircuitPayload'
import { buildCircuitInputsFromPayload } from './intentHash'

const circuitPayload = humanPayloadToCircuitPayload(demoHumanSafePayPayload)

export const paymentIntentInputs = buildCircuitInputsFromPayload(circuitPayload)

export type PaymentIntentInputs = typeof paymentIntentInputs

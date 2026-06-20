
import { demoHumanSafePayPayload } from '../src/lib/humanSafePayPayload.ts'
import { humanPayloadToCircuitPayload } from '../src/lib/humanPayloadToCircuitPayload.ts'

const circuitPayload = humanPayloadToCircuitPayload(demoHumanSafePayPayload)

console.log(JSON.stringify(circuitPayload, null, 2))

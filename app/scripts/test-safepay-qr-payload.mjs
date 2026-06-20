import { demoHumanSafePayPayload } from '../src/lib/humanSafePayPayload.ts'
import {
  createSafePayQrPayload,
  createSafePayPaymentLink,
  parseSafePayPaymentLink,
} from '../src/lib/safepayQrPayload.ts'

const qrPayload = createSafePayQrPayload(demoHumanSafePayPayload)
const paymentLink = createSafePayPaymentLink(qrPayload)
const parsed = parseSafePayPaymentLink(paymentLink)

console.log('Payment link:')
console.log(paymentLink)
console.log('')
console.log('Parsed payload:')
console.log(JSON.stringify(parsed, null, 2))

if (JSON.stringify(parsed) !== JSON.stringify(qrPayload)) {
  throw new Error('Parsed QR payload does not match original payload')
}

console.log('')
console.log('✅ SafePay QR payload encode/decode works.')

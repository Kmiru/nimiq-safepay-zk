import type { SafePayPayload } from './safepayPayload'
import type { HumanSafePayPayload } from './humanSafePayPayload'
import {
  utf8ToFieldString,
  numberToFieldString,
  nimToLunaString,
  unixTimestampToU32String,
  assertFieldString,
} from './canonicalFields'

export function humanPayloadToCircuitPayload(
  payload: HumanSafePayPayload
): SafePayPayload {
  return {
    domainSeparator: utf8ToFieldString(payload.domainSeparator),
    nimiqNetworkId: utf8ToFieldString(payload.nimiqNetworkId),
    evmVerifierChainId: numberToFieldString(payload.evmVerifierChainId),
    version: utf8ToFieldString(payload.version),
    type: utf8ToFieldString(payload.type),
    network: utf8ToFieldString(payload.network),
    recipient: utf8ToFieldString(payload.recipient),
    amountLuna: nimToLunaString(payload.amountNim),
    memoSecretHash: assertFieldString(payload.memoSecretHash),
    expiresAt: unixTimestampToU32String(payload.expiresAt),
    nonce: assertFieldString(payload.nonce),
    salt: assertFieldString(payload.salt),
    secret: assertFieldString(payload.secret),
  }
}

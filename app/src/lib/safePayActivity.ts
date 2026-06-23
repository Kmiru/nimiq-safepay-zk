export type SafePayActivityStatus = 'verified' | 'failed'

export type SafePayPaymentStatus = 'not_paid' | 'sent'

export type SafePayActivityItem = {
  id: string
  createdAt: string
  amountNim: string
  recipientShort: string
  network: string
  verificationStatus: SafePayActivityStatus
  paymentStatus: SafePayPaymentStatus
  intentHashShort?: string
  txHashShort?: string
}

const STORAGE_KEY = 'safepay.zk.activity.v1'
const MAX_ITEMS = 8

export function getSafePayActivity(): SafePayActivityItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed
  } catch {
    return []
  }
}

export function saveSafePayActivity(item: SafePayActivityItem) {
  if (typeof window === 'undefined') return

  const current = getSafePayActivity()
  const withoutDuplicate = current.filter((entry) => entry.id !== item.id)
  const next = [item, ...withoutDuplicate].slice(0, MAX_ITEMS)

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function updateSafePayActivityPayment(id: string, txHashShort?: string) {
  if (typeof window === 'undefined') return

  const current = getSafePayActivity()

  const next = current.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          paymentStatus: 'sent' as const,
          txHashShort,
        }
      : entry,
  )

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearSafePayActivity() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(STORAGE_KEY)
}

export function shortValue(value?: string | null) {
  if (!value) return undefined

  if (value.length <= 16) return value

  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

export function shortRecipient(address: string) {
  const clean = address.replaceAll(' ', '')

  if (clean.length <= 16) return clean

  return `${clean.slice(0, 6)} ··· ${clean.slice(-5)}`
}

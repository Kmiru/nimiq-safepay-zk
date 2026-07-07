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
  payerShort?: string
}

const STORAGE_KEY = 'safepay.zk.activity.v1'
const PAID_REQUESTS_STORAGE_KEY = 'safepay.zk.paidRequests.v1'
const BUSINESS_ORDERS_STORAGE_KEY = 'safepay.zk.businessOrders.v1'
const MAX_ITEMS = 8
const MAX_PAID_REQUESTS = 32
const MAX_BUSINESS_ORDERS = 20

export type SafePayPaidRequestRecord = {
  id: string
  requestKey: string
  payerAddress: string
  recipientAddress: string
  amountNim: string
  network: string
  txHash: string
  paidAt: string
  orderNumber?: string
  intentHashShort?: string
  txHashShort?: string
}

export type SafePayBusinessOrderRecord = {
  id: string
  orderNumber: string
  businessName: string
  totalNim: string
  createdAt: string
  expiresAt: string
  status: 'draft' | 'active' | 'cancelled' | 'paid' | 'expired'
  recipientAddress: string
  network: 'testnet' | 'mainnet'
  requestLink: string
  txHash?: string
  paidAt?: string
}

export function normalizeWalletAddress(address: string) {
  return address.replace(/\s+/g, '').toUpperCase()
}

export function getWalletPaidRequestId(params: {
  requestKey: string
  payerAddress: string
}) {
  return `${normalizeWalletAddress(params.payerAddress)}:${params.requestKey}`
}

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

export function updateSafePayActivityPayment(
  id: string,
  txHashShort?: string,
  payerShort?: string,
) {
  if (typeof window === 'undefined') return

  const current = getSafePayActivity()

  const next = current.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          paymentStatus: 'sent' as const,
          txHashShort,
          payerShort,
        }
      : entry,
  )

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}


export function getSafePayPaidRequests(): SafePayPaidRequestRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(PAID_REQUESTS_STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is SafePayPaidRequestRecord => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        typeof entry.requestKey === 'string' &&
        typeof entry.payerAddress === 'string' &&
        typeof entry.recipientAddress === 'string' &&
        typeof entry.amountNim === 'string' &&
        typeof entry.network === 'string' &&
        typeof entry.txHash === 'string' &&
        typeof entry.paidAt === 'string'
      )
    })
  } catch {
    return []
  }
}

export function getSafePayPaidRequest(params: {
  requestKey: string
  payerAddress: string | null | undefined
}): SafePayPaidRequestRecord | null {
  if (!params.payerAddress) return null

  const paidRequestId = getWalletPaidRequestId({
    requestKey: params.requestKey,
    payerAddress: params.payerAddress,
  })

  return getSafePayPaidRequests().find((entry) => entry.id === paidRequestId) ?? null
}

export function hasWalletPaidSafePayRequest(params: {
  requestKey: string
  payerAddress: string | null | undefined
}) {
  return !!getSafePayPaidRequest(params)
}

export function saveSafePayPaidRequest(record: SafePayPaidRequestRecord) {
  if (typeof window === 'undefined') return

  const current = getSafePayPaidRequests()
  const withoutDuplicate = current.filter((entry) => entry.id !== record.id)
  const next = [record, ...withoutDuplicate].slice(0, MAX_PAID_REQUESTS)

  window.localStorage.setItem(PAID_REQUESTS_STORAGE_KEY, JSON.stringify(next))
}


export function getSafePayBusinessOrders(): SafePayBusinessOrderRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(BUSINESS_ORDERS_STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is SafePayBusinessOrderRecord => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        typeof entry.orderNumber === 'string' &&
        typeof entry.businessName === 'string' &&
        typeof entry.totalNim === 'string' &&
        typeof entry.createdAt === 'string' &&
        typeof entry.expiresAt === 'string' &&
        typeof entry.status === 'string' &&
        typeof entry.recipientAddress === 'string' &&
        (entry.network === 'testnet' || entry.network === 'mainnet') &&
        typeof entry.requestLink === 'string'
      )
    })
  } catch {
    return []
  }
}

export function saveSafePayBusinessOrder(record: SafePayBusinessOrderRecord) {
  if (typeof window === 'undefined') return

  const current = getSafePayBusinessOrders()
  const withoutDuplicate = current.filter((entry) => entry.id !== record.id)
  const next = [record, ...withoutDuplicate].slice(0, MAX_BUSINESS_ORDERS)

  window.localStorage.setItem(BUSINESS_ORDERS_STORAGE_KEY, JSON.stringify(next))
}

export function updateSafePayBusinessOrderStatus(params: {
  orderId: string
  status: SafePayBusinessOrderRecord['status']
  txHash?: string
  paidAt?: string
}) {
  if (typeof window === 'undefined') return

  const current = getSafePayBusinessOrders()

  const next = current.map((entry) =>
    entry.id === params.orderId
      ? {
          ...entry,
          status: params.status,
          txHash: params.txHash ?? entry.txHash,
          paidAt: params.paidAt ?? entry.paidAt,
        }
      : entry,
  )

  window.localStorage.setItem(BUSINESS_ORDERS_STORAGE_KEY, JSON.stringify(next))
}

export function clearSafePayBusinessOrders() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(BUSINESS_ORDERS_STORAGE_KEY)
}

export function clearSafePayPaidRequests() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(PAID_REQUESTS_STORAGE_KEY)
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

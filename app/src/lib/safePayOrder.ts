function createSafePayId(prefix = 'sp'): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((value) => value.toString(16).padStart(2, '0'))
          .join('')
      : Math.random().toString(36).slice(2, 12)

  return `${prefix}_${Date.now().toString(36)}_${randomPart}`
}

export type SafePayOrderItem = {
  id: string
  name: string
  quantity: number
  unitPriceNim: string
}

export type SafePayOrderDraft = {
  businessName: string
  items: SafePayOrderItem[]
  expiresInMinutes: number
}

export type SafePayOrder = SafePayOrderDraft & {
  id: string
  orderNumber: string
  totalNim: string
  createdAt: string
  expiresAt: string
  status: 'draft' | 'active' | 'cancelled' | 'paid' | 'expired'
}

export function createEmptyOrderItem(): SafePayOrderItem {
  return {
    id: createSafePayId('item'),
    name: '',
    quantity: 1,
    unitPriceNim: '',
  }
}

export function calculateOrderTotalNim(items: SafePayOrderItem[]): string {
  const total = items.reduce((sum, item) => {
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPriceNim)

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return sum
    }

    return sum + quantity * unitPrice
  }, 0)

  return total.toFixed(2)
}

export function hasValidOrderItems(items: SafePayOrderItem[]): boolean {
  return items.some((item) => {
    const name = item.name.trim()
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPriceNim)

    return (
      name.length > 0 &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(unitPrice) &&
      unitPrice > 0
    )
  })
}

export function getCleanOrderItems(items: SafePayOrderItem[]): SafePayOrderItem[] {
  return items
    .map((item) => ({
      ...item,
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unitPriceNim: Number(item.unitPriceNim).toFixed(2),
    }))
    .filter((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPriceNim)

      return item.name.length > 0 && quantity > 0 && unitPrice > 0
    })
}

export function createSafePayOrder(draft: SafePayOrderDraft): SafePayOrder {
  const cleanItems = getCleanOrderItems(draft.items)
  const createdAt = new Date()
  const expiresAt = new Date(
    createdAt.getTime() + draft.expiresInMinutes * 60 * 1000,
  )

  return {
    id: createSafePayId('order'),
    orderNumber: `SP-${Date.now().toString().slice(-6)}`,
    businessName: draft.businessName.trim() || 'SafePay Merchant',
    items: cleanItems,
    totalNim: calculateOrderTotalNim(cleanItems),
    expiresInMinutes: draft.expiresInMinutes,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  }
}

export type SafePayOrderRequestPayload = {
  version: 'safepay-order-v1'
  type: 'payment-request'
  recipient: string
  network: 'testnet' | 'mainnet'
  order: SafePayOrder
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function createSafePayOrderRequestPayload(params: {
  order: SafePayOrder
  recipient: string
  network?: 'testnet' | 'mainnet'
}): SafePayOrderRequestPayload {
  return {
    version: 'safepay-order-v1',
    type: 'payment-request',
    recipient: params.recipient,
    network: params.network ?? 'testnet',
    order: params.order,
  }
}

export function createSafePayOrderRequestLink(params: {
  payload: SafePayOrderRequestPayload
  appBaseUrl: string
}): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(params.payload))
  const url = new URL(params.appBaseUrl)

  url.searchParams.set('flow', 'nimiq')
  url.searchParams.set('request', encodedPayload)

  return url.toString()
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )

  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

function isSafePayOrder(value: unknown): value is SafePayOrder {
  if (!value || typeof value !== 'object') return false

  const order = value as Partial<SafePayOrder>

  return (
    typeof order.id === 'string' &&
    typeof order.orderNumber === 'string' &&
    typeof order.businessName === 'string' &&
    Array.isArray(order.items) &&
    typeof order.totalNim === 'string' &&
    typeof order.createdAt === 'string' &&
    typeof order.expiresAt === 'string' &&
    typeof order.status === 'string'
  )
}

export function parseSafePayOrderRequestPayload(
  encodedPayload: string,
): SafePayOrderRequestPayload {
  const decoded = decodeBase64Url(encodedPayload)
  const parsed = JSON.parse(decoded) as unknown

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid SafePay request.')
  }

  const payload = parsed as Partial<SafePayOrderRequestPayload>

  if (payload.version !== 'safepay-order-v1') {
    throw new Error('Unsupported SafePay request version.')
  }

  if (payload.type !== 'payment-request') {
    throw new Error('Unsupported SafePay request type.')
  }

  if (typeof payload.recipient !== 'string' || payload.recipient.length === 0) {
    throw new Error('Missing payment recipient.')
  }

  if (payload.network !== 'testnet' && payload.network !== 'mainnet') {
    throw new Error('Unsupported payment network.')
  }

  if (!isSafePayOrder(payload.order)) {
    throw new Error('Invalid SafePay order.')
  }

  return {
    version: payload.version,
    type: payload.type,
    recipient: payload.recipient,
    network: payload.network,
    order: payload.order,
  }
}

export function getSafePayOrderRequestFromUrl(
  urlValue = window.location.href,
): SafePayOrderRequestPayload | null {
  const url = new URL(urlValue)
  const encodedRequest = url.searchParams.get('request')

  if (!encodedRequest) {
    return null
  }

  return parseSafePayOrderRequestPayload(encodedRequest)
}

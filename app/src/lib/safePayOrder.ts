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

export type SafePayOrderRequestPayload = {
  version: 'safepay-order-v1'
  type: 'payment-request'
  recipient: string
  network: 'testnet' | 'mainnet'
  order: SafePayOrder
}

type CompactSafePayOrderRequestPayload = {
  v: 1
  t: 'p'
  r: string
  n: 't' | 'm'
  d: string
  o: string
  b: string
  a: string
  c: string
  e: string
  s: 'draft' | 'active' | 'cancelled' | 'paid' | 'expired'
  i: [string, number, string][]
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

function compactText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export function getCleanOrderItems(items: SafePayOrderItem[]): SafePayOrderItem[] {
  return items
    .map((item) => ({
      ...item,
      name: compactText(item.name, 48),
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
    businessName: compactText(draft.businessName, 40) || 'SafePay Merchant',
    items: cleanItems,
    totalNim: calculateOrderTotalNim(cleanItems),
    expiresInMinutes: draft.expiresInMinutes,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  }
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
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

function toCompactSafePayOrderRequestPayload(
  payload: SafePayOrderRequestPayload,
): CompactSafePayOrderRequestPayload {
  return {
    v: 1,
    t: 'p',
    r: payload.recipient,
    n: payload.network === 'mainnet' ? 'm' : 't',
    d: payload.order.id,
    o: payload.order.orderNumber,
    b: compactText(payload.order.businessName, 40),
    a: Number(payload.order.totalNim).toFixed(2),
    c: payload.order.createdAt,
    e: payload.order.expiresAt,
    s: payload.order.status,
    i: payload.order.items.map((item) => [
      compactText(item.name, 48),
      Number(item.quantity),
      Number(item.unitPriceNim).toFixed(2),
    ]),
  }
}

function fromCompactSafePayOrderRequestPayload(
  compact: CompactSafePayOrderRequestPayload,
): SafePayOrderRequestPayload {
  const expiresAtTime = new Date(compact.e).getTime()
  const createdAtTime = new Date(compact.c).getTime()
  const expiresInMinutes =
    Number.isFinite(expiresAtTime) && Number.isFinite(createdAtTime)
      ? Math.max(1, Math.round((expiresAtTime - createdAtTime) / 60000))
      : 15

  const items = compact.i
    .map((item, index): SafePayOrderItem => ({
      id: `${compact.d}_item_${index + 1}`,
      name: compactText(String(item[0] ?? ''), 48),
      quantity: Number(item[1]),
      unitPriceNim: Number(item[2]).toFixed(2),
    }))
    .filter((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPriceNim)

      return item.name.length > 0 && quantity > 0 && unitPrice > 0
    })

  const safeItems =
    items.length > 0
      ? items
      : [
          {
            id: `${compact.d}_item_1`,
            name: `Payment request ${compact.o}`,
            quantity: 1,
            unitPriceNim: Number(compact.a).toFixed(2),
          },
        ]

  const order: SafePayOrder = {
    id: compact.d,
    orderNumber: compact.o,
    businessName: compact.b,
    items: safeItems,
    totalNim: Number(compact.a).toFixed(2),
    expiresInMinutes,
    createdAt: compact.c,
    expiresAt: compact.e,
    status: compact.s,
  }

  return {
    version: 'safepay-order-v1',
    type: 'payment-request',
    recipient: compact.r,
    network: compact.n === 'm' ? 'mainnet' : 'testnet',
    order,
  }
}

export function createSafePayOrderRequestLink(params: {
  payload: SafePayOrderRequestPayload
  appBaseUrl: string
}): string {
  const compactPayload = toCompactSafePayOrderRequestPayload(params.payload)
  const encodedPayload = encodeBase64Url(JSON.stringify(compactPayload))
  const url = new URL(params.appBaseUrl)

  url.searchParams.delete('flow')
  url.searchParams.delete('request')
  url.searchParams.set('sp', encodedPayload)

  return url.toString()
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

function isCompactSafePayOrderRequestPayload(
  value: unknown,
): value is CompactSafePayOrderRequestPayload {
  if (!value || typeof value !== 'object') return false

  const payload = value as Partial<CompactSafePayOrderRequestPayload>

  return (
    payload.v === 1 &&
    payload.t === 'p' &&
    typeof payload.r === 'string' &&
    payload.r.length > 0 &&
    (payload.n === 't' || payload.n === 'm') &&
    typeof payload.d === 'string' &&
    typeof payload.o === 'string' &&
    typeof payload.b === 'string' &&
    typeof payload.a === 'string' &&
    typeof payload.c === 'string' &&
    typeof payload.e === 'string' &&
    typeof payload.s === 'string' &&
    Array.isArray(payload.i)
  )
}

export function parseCompactSafePayOrderRequestPayload(
  encodedPayload: string,
): SafePayOrderRequestPayload {
  const decoded = decodeBase64Url(encodedPayload)
  const parsed = JSON.parse(decoded) as unknown

  if (!isCompactSafePayOrderRequestPayload(parsed)) {
    throw new Error('Invalid compact SafePay request.')
  }

  return fromCompactSafePayOrderRequestPayload(parsed)
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
  const compactRequest = url.searchParams.get('sp')
  const legacyRequest = url.searchParams.get('request')

  if (compactRequest) {
    return parseCompactSafePayOrderRequestPayload(compactRequest)
  }

  if (legacyRequest) {
    return parseSafePayOrderRequestPayload(legacyRequest)
  }

  return null
}

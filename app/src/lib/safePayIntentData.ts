function normalizeIntentHash(intentHash: string | null | undefined): string {
  const value = intentHash?.trim()

  if (!value) {
    throw new Error(
      'Missing SafePay intentHash. Verify the payment request before paying.'
    )
  }

  return value.startsWith('0x') ? value.slice(2) : value
}

export function intentHashToCompactData(
  intentHash: string | null | undefined,
): string {
  const cleanHash = normalizeIntentHash(intentHash)

  if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
    throw new Error('Invalid SafePay intentHash format.')
  }

  const bytes = new Uint8Array(
    cleanHash.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  )

  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  const encodedHash = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const data = `sp1:${encodedHash}`

  if (new TextEncoder().encode(data).length > 64) {
    throw new Error('SafePay transaction data is too long.')
  }

  return data
}

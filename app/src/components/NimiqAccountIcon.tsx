import { useEffect, useState } from 'react'
import Identicons from '@nimiq/identicons'

type NimiqAccountIconProps = {
  address: string | null
}

export function NimiqAccountIcon({ address }: NimiqAccountIconProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function generateIcon() {
      if (!address) {
        setDataUrl(null)
        return
      }

      try {
        const icon = await Identicons.toDataUrl(address)

        if (!cancelled) {
          setDataUrl(icon)
        }
      } catch (error) {
        console.error('Failed to generate Nimiq identicon:', error)

        if (!cancelled) {
          setDataUrl(null)
        }
      }
    }

    generateIcon()

    return () => {
      cancelled = true
    }
  }, [address])

  return (
    <div className="nq-wallet-avatar">
      {dataUrl ? (
        <img
          className="nq-account-identicon"
          src={dataUrl}
          alt="Nimiq account icon"
        />
      ) : (
        <span className="nq-account-identicon-placeholder" />
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'

type UseQrScannerParams = {
  onScan: (value: string) => void
}

function isProbablyInsecureContext() {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  )
}

function getScannerErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error)

  if (isProbablyInsecureContext()) {
    return [
      'Camera scanning is not available in this local demo URL.',
      '',
      'The app is running over HTTP from a local IP address.',
      'For this demo, use “Load Demo” or paste a SafePay link manually.',
      '',
      'To scan QR codes inside Nimiq Pay, use an HTTPS app URL.',
    ].join('\n')
  }

  if (
    rawMessage.toLowerCase().includes('camera not found') ||
    rawMessage.toLowerCase().includes('notfound')
  ) {
    return [
      'Camera not found in this WebView.',
      '',
      'Try opening the app with an HTTPS URL, or use “Load Demo” / paste a SafePay link manually.',
    ].join('\n')
  }

  if (
    rawMessage.toLowerCase().includes('permission') ||
    rawMessage.toLowerCase().includes('denied')
  ) {
    return [
      'Camera permission was denied or unavailable.',
      '',
      'Check camera permission for Nimiq Pay, then reopen the Mini App.',
    ].join('\n')
  }

  return rawMessage
}

export function useQrScanner({ onScan }: UseQrScannerParams) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const [scannerRunning, setScannerRunning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    }
  }, [])

  async function startQrScanner() {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not ready.')
      }

      setScannerError(null)

      if (isProbablyInsecureContext()) {
        throw new Error('Camera requires HTTPS in this context.')
      }

      const hasCamera = await QrScanner.hasCamera()

      if (!hasCamera) {
        throw new Error('Camera not found.')
      }

      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const scannedValue =
              typeof result === 'string' ? result : result.data

            console.log('QR scanned:', scannedValue)

            if (!scannedValue || scannedValue.trim().length === 0) {
              setScannerError('QR detected, but it was empty.')
              return
            }

            setScannerError(null)
            onScan(scannedValue.trim())

            if (scannerRef.current) {
              scannerRef.current.stop()
            }

            setScannerRunning(false)
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 8,
            returnDetailedScanResult: true,
          }
        )
      }

      setScannerRunning(true)
      await new Promise((resolve) => window.setTimeout(resolve, 150))
      await scannerRef.current.start()
    } catch (error) {
      console.error(error)

      setScannerRunning(false)
      setScannerError(getScannerErrorMessage(error))
    }
  }

  function stopQrScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop()
    }

    setScannerRunning(false)
  }

  return {
    videoRef,
    scannerRunning,
    scannerError,
    setScannerError,
    startQrScanner,
    stopQrScanner,
  }
}
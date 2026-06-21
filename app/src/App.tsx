import { useRef, useState } from 'react'
import './App.css'

import { AppHeader } from './components/AppHeader'
import { ScanPaymentCard } from './components/ScanPaymentCard'
import { PaymentReviewCard } from './components/PaymentReviewCard'
import { VerifiedResultCard } from './components/VerifiedResultCard'
import { DevPanel } from './components/DevPanel'

import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useQrScanner } from './hooks/useQrScanner'
import { useSafePayVerification } from './hooks/useSafePayVerification'
import { usePaymentReview } from './hooks/usePaymentReview'

import { demoHumanSafePayPayload } from './lib/humanSafePayPayload'
import {
  createSafePayQrPayload,
  createSafePayPaymentLink,
  parseSafePayPaymentLink,
} from './lib/safepayQrPayload'
import { createQrCodeDataUrl } from './lib/qrCode'
import { LOCAL_HONK_VERIFIER_ADDRESS } from './config/localVerifier'
import { useNimiqProvider } from './hooks/useNimiqProvider'
import { NimiqProviderCard } from './components/NimiqProviderCard'
import { useNimiqPayment } from './hooks/useNimiqPayment'
import { NimiqPaymentCard } from './components/NimiqPaymentCard'
import { ProgressSteps } from './components/ProgressSteps'



const DEMO_QR_PAYLOAD = createSafePayQrPayload(demoHumanSafePayPayload)
const DEMO_PAYMENT_LINK = createSafePayPaymentLink(DEMO_QR_PAYLOAD)
const IS_GITHUB_PAGES =
  typeof window !== 'undefined' &&
  window.location.hostname === 'kmiru.github.io'

const SHOULD_RUN_LOCAL_EVM = !IS_GITHUB_PAGES
const DEMO_SHORT_QR_LINK = 'safepay-zk://pay/demo-request?v=1&id=demo-25-nim'

function getFriendlyPaymentLinkError(link: string) {
  const trimmedLink = link.trim()
  const lowerLink = trimmedLink.toLowerCase()

  if (lowerLink.startsWith('nimiq:')) {
    return new Error(
      'Standard Nimiq QR detected. This is not a SafePay request. Use a SafePay QR or Load Demo Request.'
    )
  }

  if (
    lowerLink.startsWith('http://') ||
    lowerLink.startsWith('https://') ||
    lowerLink.startsWith('safepay-zk://')
  ) {
    return null
  }

  return new Error(
    'Unsupported QR format. SafePay ZK can only verify SafePay payment requests.'
  )
}

function App() {
  const paymentReviewRef = useRef<HTMLElement | null>(null)
  const qrPreviewRef = useRef<HTMLDivElement | null>(null)
  const devPanelRef = useRef<HTMLElement | null>(null)
  const devZkStatusRef = useRef<HTMLDivElement | null>(null)
  const devEvmStatusRef = useRef<HTMLDivElement | null>(null)
  const verifiedResultRef = useRef<HTMLElement | null>(null)
  const nimiqProvider = useNimiqProvider()

  const { scrollToElement } = useSmoothScroll()

  const [showDevPanel, setShowDevPanel] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [manualPaymentLink, setManualPaymentLink] = useState('')

  const {
    paymentStatus: nimiqPaymentStatus,
    resetPaymentStatus: resetNimiqPaymentStatus,
    sendPayment: sendNimiqPayment,
  } = useNimiqPayment()

  const {
    status,
    evmStatus,
    resetZkAndEvmStatus,
    runPaymentIntentProof,
    verifyOnLocalEvm,
  } = useSafePayVerification({
    verifierAddress: LOCAL_HONK_VERIFIER_ADDRESS,
  })

  const {
    paymentReview,
    reviewStatus,
    reviewError,
    resetPaymentReview,
    resetReviewVerificationState,
    handleParseSuccess,
    handleParseError,
    markReviewVerifying,
    markReviewVerified,
    markReviewFailed,
  } = usePaymentReview()

  const {
    videoRef,
    scannerRunning,
    scannerError,
    setScannerError,
    startQrScanner,
    stopQrScanner,
  } = useQrScanner({
    onScan: parseScannedPaymentLink,
  })


  function resetVerificationState() {
    resetReviewVerificationState()
    resetZkAndEvmStatus()
    resetNimiqPaymentStatus()
  }

  function resetFlow() {
    resetPaymentReview()
    resetZkAndEvmStatus()
    resetNimiqPaymentStatus()
    setManualPaymentLink('')
    setScannerError(null)
    setQrError(null)
  }

  function loadDemoPaymentLink() {
    setManualPaymentLink(DEMO_PAYMENT_LINK)
    resetVerificationState()
  }

  async function verifyBeforePayment() {
    try {
      if (!paymentReview) {
        throw new Error('Paste or scan a SafePay request before verifying.')
      }

      if (paymentReview.isExpired) {
        throw new Error(
          'This payment request has expired. Ask the sender for a new request.'
        )
      }

      markReviewVerifying()
      scrollToElement(paymentReviewRef)

      const zkVerified = await runPaymentIntentProof()

      if (!zkVerified) {
        throw new Error(
          'The browser ZK proof could not be verified. Do not continue with this payment.'
        )
      }

      if (SHOULD_RUN_LOCAL_EVM) {
        const evmVerified = await verifyOnLocalEvm()

        if (!evmVerified) {
          throw new Error(
            'The local EVM verifier rejected this payment request. Do not continue with this payment.'
          )
        }
      } else {
        console.warn(
          'Local EVM verifier skipped on GitHub Pages. Browser ZK proof verified.'
        )
      }

      markReviewVerified()
      scrollToElement(verifiedResultRef)
    } catch (error) {
      console.error(error)

      markReviewFailed(error)
      scrollToElement(paymentReviewRef)
    }
  }

  function parseManualPaymentLink() {
    try {
      const pastedLink = manualPaymentLink.trim()

      const friendlyError = getFriendlyPaymentLinkError(pastedLink)

      if (friendlyError) {
        throw friendlyError
      }

      const parsed = parseSafePayPaymentLink(pastedLink)

      handleParseSuccess(parsed)
      scrollToElement(paymentReviewRef)
    } catch (error) {
      console.error(error)

      handleParseError(error)
      scrollToElement(paymentReviewRef)
    }
  }

  function parseScannedPaymentLink(link: string) {
    try {
      const scannedLink = link.trim()

      const friendlyError = getFriendlyPaymentLinkError(scannedLink)

      if (friendlyError) {
        throw friendlyError
      }

      const linkToParse =
        scannedLink === DEMO_SHORT_QR_LINK ? DEMO_PAYMENT_LINK : scannedLink

      const parsed = parseSafePayPaymentLink(linkToParse)

      setManualPaymentLink(linkToParse)
      handleParseSuccess(parsed)
      setScannerError(null)
      scrollToElement(paymentReviewRef)
    } catch (error) {
      console.error(error)

      setManualPaymentLink(link.trim())
      handleParseError(error)
      setScannerError(error instanceof Error ? error.message : String(error))
      scrollToElement(paymentReviewRef)
    }
  }

  async function generatePaymentLinkQr() {
    try {
      const dataUrl = await createQrCodeDataUrl(DEMO_SHORT_QR_LINK)

      setQrDataUrl(dataUrl)
      setQrError(null)
      scrollToElement(qrPreviewRef)
    } catch (error) {
      console.error(error)

      setQrDataUrl(null)
      setQrError(error instanceof Error ? error.message : String(error))
    }
  }

  function toggleDevPanel() {
    const nextValue = !showDevPanel

    setShowDevPanel(nextValue)

    if (nextValue) {
      scrollToElement(devPanelRef, 'start')
    }
  }

  async function runDevPaymentIntentProof() {
    const verified = await runPaymentIntentProof()

    scrollToElement(devZkStatusRef)

    return verified
  }

  async function runDevLocalEvmVerification() {
    if (!SHOULD_RUN_LOCAL_EVM) {
      alert(
        'Local EVM verifier is disabled on GitHub Pages. Use localhost with Anvil, or deploy the verifier to a public HTTPS EVM RPC.'
      )

      scrollToElement(devEvmStatusRef)

      return false
    }

    const verified = await verifyOnLocalEvm()

    scrollToElement(devEvmStatusRef)

    return verified
  }

  async function sendVerifiedNimiqPayment() {
    if (!paymentReview) {
      return
    }

    await sendNimiqPayment({
      paymentReview,
      getProvider: nimiqProvider.getProvider,
    })
  }
  function getCurrentStep(): 'review' | 'verify' | 'pay' {
    if (reviewStatus === 'verified') return 'pay'
    if (paymentReview) return 'verify'
    return 'review'
  }

  return (
    <div className="app-container">
      <AppHeader
        showDevPanel={showDevPanel}
        onToggleDevPanel={toggleDevPanel}
      />

      <main className="app-main">
        <ProgressSteps
          currentStep={getCurrentStep()}
          reviewReady={!!paymentReview}
          verified={reviewStatus === 'verified'}
          paid={nimiqPaymentStatus.sent}
        />
        <NimiqProviderCard
          connecting={nimiqProvider.connecting}
          connected={nimiqProvider.connected}
          account={nimiqProvider.account}
          consensusEstablished={nimiqProvider.consensusEstablished}
          blockNumber={nimiqProvider.blockNumber}
          error={nimiqProvider.error}
          onConnect={nimiqProvider.connect}
          onDisconnectLocalState={nimiqProvider.disconnectLocalState}
        />
        <ScanPaymentCard
          manualPaymentLink={manualPaymentLink}
          scannerRunning={scannerRunning}
          scannerError={scannerError}
          qrDataUrl={qrDataUrl}
          qrError={qrError}
          videoRef={videoRef}
          qrPreviewRef={qrPreviewRef}
          onManualPaymentLinkChange={(value) => {
            setManualPaymentLink(value)
            resetVerificationState()
          }}
          onParsePaymentLink={parseManualPaymentLink}
          onLoadDemoPaymentLink={loadDemoPaymentLink}
          onStartQrScanner={startQrScanner}
          onStopQrScanner={stopQrScanner}
          onGenerateDemoQr={generatePaymentLinkQr}
        />

        {paymentReview && (
          <PaymentReviewCard
            paymentReview={paymentReview}
            reviewStatus={reviewStatus}
            reviewError={reviewError}
            paymentReviewRef={paymentReviewRef}
            onVerifyBeforePayment={verifyBeforePayment}
            onResetFlow={resetFlow}
          />
        )}

        {reviewStatus === 'verified' && (
          <VerifiedResultCard
            verifiedResultRef={verifiedResultRef}
            browserProofVerified={status.proofVerified}
            evmVerified={evmStatus.verified}
            proofSize={status.proofSize}
            onResetFlow={resetFlow}
          />
        )}
        {paymentReview && reviewStatus === 'verified' && (
          <NimiqPaymentCard
            paymentReview={paymentReview}
            nimiqConnected={nimiqProvider.connected}
            privateIntentVerified={reviewStatus === 'verified'}
            paymentStatus={nimiqPaymentStatus}
            onSendPayment={sendVerifiedNimiqPayment}
          />
        )}

        {showDevPanel && (
          <DevPanel
            devPanelRef={devPanelRef}
            devZkStatusRef={devZkStatusRef}
            devEvmStatusRef={devEvmStatusRef}
            demoPaymentLink={DEMO_PAYMENT_LINK}
            status={status}
            evmStatus={evmStatus}
            onRunZkProof={runDevPaymentIntentProof}
            onRunEvmVerification={runDevLocalEvmVerification}
          />
        )}
      </main>
    </div>
  )
}

export default App
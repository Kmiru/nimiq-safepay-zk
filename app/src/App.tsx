import { useEffect, useRef, useState } from 'react'
import './App.css'

import { AppHeader } from './components/AppHeader'
import { ScanPaymentCard } from './components/ScanPaymentCard'
import { PaymentReviewCard } from './components/PaymentReviewCard'
import { VerifiedResultCard } from './components/VerifiedResultCard'
import { DevPanel } from './components/DevPanel'
import { CreateRequestCard } from './components/CreateRequestCard'

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
import {
  createSafePayOrder,
  createSafePayOrderRequestLink,
  createSafePayOrderRequestPayload,
  getSafePayOrderRequestFromUrl,
  type SafePayOrder,
  type SafePayOrderDraft,
} from './lib/safePayOrder'
import { LOCAL_HONK_VERIFIER_ADDRESS } from './config/localVerifier'
import { useNimiqProvider } from './hooks/useNimiqProvider'
import { NimiqProviderCard } from './components/NimiqProviderCard'
import { useNimiqPayment } from './hooks/useNimiqPayment'
import { NimiqPaymentCard } from './components/NimiqPaymentCard'
import { ProgressSteps } from './components/ProgressSteps'
import { NimiqPayFlowShell } from './components/NimiqPayFlowShell'



const DEMO_QR_PAYLOAD = createSafePayQrPayload(demoHumanSafePayPayload)
const DEMO_PAYMENT_LINK = createSafePayPaymentLink(DEMO_QR_PAYLOAD)
const IS_GITHUB_PAGES =
  typeof window !== 'undefined' &&
  window.location.hostname === 'kmiru.github.io'

const LOCAL_UI_DEV_MODE = false //Cuando quieras probar Local EVM real cambia true to false y ejecuta anvil y el verifier localmente. Si quieres probar la UI sin anvil ni verifier, ponlo en true.
const SHOULD_RUN_LOCAL_EVM = !IS_GITHUB_PAGES && !LOCAL_UI_DEV_MODE
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
  const paymentCardRef = useRef<HTMLDivElement | null>(null)
  const nimiqProvider = useNimiqProvider()

  const { scrollToElement } = useSmoothScroll()

  const [showDevPanel, setShowDevPanel] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [manualPaymentLink, setManualPaymentLink] = useState('')
  const [createdRequestQr, setCreatedRequestQr] = useState<string | null>(null)
  const [createdRequestLink, setCreatedRequestLink] = useState<string | null>(null)
  const [createdRequestError, setCreatedRequestError] = useState<string | null>(null)
  const [activeSafePayOrder, setActiveSafePayOrder] =
    useState<SafePayOrder | null>(null)
  const [activeSafePayOrderRecipient, setActiveSafePayOrderRecipient] =
    useState<string | null>(null)
  const [activeSafePayOrderNetwork, setActiveSafePayOrderNetwork] =
    useState<'testnet' | 'mainnet' | null>(null)
  const [incomingSafePayRequestError, setIncomingSafePayRequestError] =
    useState<string | null>(null)

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

  useEffect(() => {
    try {
      const payload = getSafePayOrderRequestFromUrl()

      if (!payload) {
        return
      }

      console.log('Incoming SafePay order request:', payload)

      setActiveSafePayOrder(payload.order)
      setActiveSafePayOrderRecipient(payload.recipient)
      setActiveSafePayOrderNetwork(payload.network)
      setIncomingSafePayRequestError(null)
    } catch (error) {
      console.error(error)

      setActiveSafePayOrder(null)
      setActiveSafePayOrderRecipient(null)
      setActiveSafePayOrderNetwork(null)
      setIncomingSafePayRequestError(
        error instanceof Error ? error.message : String(error),
      )
    }
  }, [])


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

  function loadDemoPaymentForPreview() {
    setManualPaymentLink(DEMO_PAYMENT_LINK)
    resetVerificationState()

    try {
      const parsed = parseSafePayPaymentLink(DEMO_PAYMENT_LINK)

      handleParseSuccess(parsed)
      scrollToElement(paymentReviewRef)
    } catch (error) {
      console.error(error)

      handleParseError(error)
    }
  }

  async function createSafePayRequest(orderDraft?: SafePayOrderDraft) {
    const safePayOrder = orderDraft ? createSafePayOrder(orderDraft) : null

    if (orderDraft && !nimiqProvider.account) {
      setActiveSafePayOrder(null)
      setActiveSafePayOrderRecipient(null)
      setActiveSafePayOrderNetwork(null)
      setCreatedRequestQr(null)
      setCreatedRequestLink(null)
      setCreatedRequestError(
        'Connect with Nimiq Pay first. Your connected address is used as the payment recipient.',
      )
      return
    }

    try {
      let requestLink = DEMO_SHORT_QR_LINK

      if (safePayOrder && nimiqProvider.account) {
        const payload = createSafePayOrderRequestPayload({
          order: safePayOrder,
          recipient: nimiqProvider.account,
          network: 'testnet',
        })

        const appBaseUrl =
          import.meta.env.VITE_SAFEPAY_APP_URL ||
          `${window.location.origin}${import.meta.env.BASE_URL}`

        requestLink = createSafePayOrderRequestLink({
          payload,
          appBaseUrl,
        })

        console.log('SafePay active order:', safePayOrder)
        console.log('SafePay order request link:', requestLink)

        setActiveSafePayOrder(safePayOrder)
        setActiveSafePayOrderRecipient(payload.recipient)
        setActiveSafePayOrderNetwork(payload.network)
      }

      const dataUrl = await createQrCodeDataUrl(requestLink)

      setCreatedRequestQr(dataUrl)
      setCreatedRequestLink(requestLink)
      setCreatedRequestError(null)
    } catch (error) {
      console.error(error)

      setCreatedRequestQr(null)
      setCreatedRequestLink(null)
      setCreatedRequestError(error instanceof Error ? error.message : String(error))
    }
  }

  function loadCreatedRequestForReview() {
    setManualPaymentLink(DEMO_PAYMENT_LINK)
    resetVerificationState()

    try {
      const parsed = parseSafePayPaymentLink(DEMO_PAYMENT_LINK)

      handleParseSuccess(parsed)
      scrollToElement(paymentReviewRef)
    } catch (error) {
      console.error(error)

      handleParseError(error)
      scrollToElement(paymentReviewRef)
    }
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

      window.setTimeout(() => {
        scrollToElement(paymentCardRef)
      }, 120)
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

    const intentHash = status.publicInputs[0] ?? null

    await sendNimiqPayment({
      paymentReview,
      intentHash,
      getProvider: nimiqProvider.getProvider,
    })
  }
  function getCurrentStep(): 'review' | 'verify' | 'pay' {
    if (reviewStatus === 'verified') return 'pay'
    if (paymentReview) return 'verify'
    return 'review'
  }

  const useNimiqPayFlow =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('flow') === 'nimiq'

  if (useNimiqPayFlow) {
    return (
      <NimiqPayFlowShell
        manualPaymentLink={manualPaymentLink}
        scannerRunning={scannerRunning}
        scannerError={scannerError}
        videoRef={videoRef}
        createdRequestQr={createdRequestQr}
        createdRequestLink={createdRequestLink}
        createdRequestError={createdRequestError}
        activeSafePayOrder={activeSafePayOrder}
        activeSafePayOrderRecipient={activeSafePayOrderRecipient}
        activeSafePayOrderNetwork={activeSafePayOrderNetwork}
        incomingSafePayRequestError={incomingSafePayRequestError}
        paymentReview={paymentReview}
        reviewStatus={reviewStatus}
        reviewError={reviewError}
        proofPublicInputs={status.publicInputs ?? []}
        nimiqConnected={nimiqProvider.connected}
        nimiqConnecting={nimiqProvider.connecting}
        nimiqAccount={nimiqProvider.account}
        paymentStatus={nimiqPaymentStatus}
        onManualPaymentLinkChange={(value) => {
          setManualPaymentLink(value)
          resetVerificationState()
        }}
        onParsePaymentLink={parseManualPaymentLink}
        onLoadDemoPaymentForPreview={loadDemoPaymentForPreview}
        onStartQrScanner={startQrScanner}
        onStopQrScanner={stopQrScanner}
        onVerifyBeforePayment={verifyBeforePayment}
        onSendPayment={sendVerifiedNimiqPayment}
        onConnectNimiq={nimiqProvider.connect}
        onDisconnectNimiq={nimiqProvider.disconnectLocalState}
        onResetFlow={resetFlow}
        onCreateRequest={createSafePayRequest}
        onLoadCreatedRequestForReview={loadCreatedRequestForReview}
      />
    )
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
        <div className="role-grid">
          <section className="role-section">
            <div className="role-section-header">
              <span className="role-step">Receiver</span>
              <div>
                <h2>Create Request</h2>
                <p>Generate a SafePay QR for someone else to verify and pay.</p>
              </div>
            </div>

            <CreateRequestCard
              qrDataUrl={createdRequestQr}
              requestLink={createdRequestLink}
              error={createdRequestError}
              onCreateRequest={createSafePayRequest}
              onLoadRequestForReview={loadCreatedRequestForReview}
            />
          </section>

          <section className="role-section">
            <div className="role-section-header">
              <span className="role-step">Payer</span>
              <div>
                <h2>Verify Payment</h2>
                <p>Scan or load a request, review it, then verify before paying.</p>
              </div>
            </div>

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
          </section>
        </div>

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

        {paymentReview && reviewStatus === 'verified' && (
          <section className="final-flow-card">
            <VerifiedResultCard
              verifiedResultRef={verifiedResultRef}
              browserProofVerified={LOCAL_UI_DEV_MODE ? true : status.proofVerified}
              evmVerified={LOCAL_UI_DEV_MODE ? true : evmStatus.verified}
              proofSize={LOCAL_UI_DEV_MODE ? 0 : status.proofSize}
              onResetFlow={resetFlow}
            />

            <NimiqPaymentCard
              paymentReview={paymentReview}
              nimiqConnected={nimiqProvider.connected}
              privateIntentVerified={reviewStatus === 'verified'}
              paymentStatus={nimiqPaymentStatus}
              onSendPayment={sendVerifiedNimiqPayment}
            />
          </section>
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
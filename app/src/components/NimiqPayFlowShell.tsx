import { useEffect, useRef, useState, type RefObject } from 'react'
import '../styles/nimiqPayFlow.css'
import { NimiqAccountIcon } from './NimiqAccountIcon'
import {
  clearSafePayActivity,
  getSafePayActivity,
  saveSafePayActivity,
  shortRecipient,
  shortValue,
  updateSafePayActivityPayment,
  type SafePayActivityItem,
  type SafePayBusinessOrderRecord,
} from '../lib/safePayActivity'
import {
  calculateOrderTotalNim,
  createEmptyOrderItem,
  hasValidOrderItems,
  type SafePayOrder,
  type SafePayOrderDraft,
  type SafePayOrderItem,
} from '../lib/safePayOrder'

type PayScreen =
  | 'home'
  | 'business'
  | 'personal'
  | 'scan'
  | 'manual'
  | 'preview'
  | 'sent'

type ReviewStatus = 'idle' | 'verifying' | 'verified' | 'failed'

const appLogoUrl = `${import.meta.env.BASE_URL}icons/mini-app-icon-safepayzk.png`

type PaymentReviewLike = {
  amountNim: string | number
  recipient: string
  network?: string
  expiresAtLabel?: string
  memoPublic?: string
  intentHash?: string
  nullifier?: string
  isExpired?: boolean
}

type PaymentStatusLike = {
  sending?: boolean
  sent?: boolean
  error?: string | null
  txHash?: string | null
  transactionHash?: string | null
}

type NimiqPayFlowShellProps = {
  manualPaymentLink: string
  scannerRunning: boolean
  scannerError: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  createdRequestQr: string | null
  createdRequestLink: string | null
  createdRequestError: string | null
  activeSafePayOrder: SafePayOrder | null
  activeSafePayOrderRecipient: string | null
  activeSafePayOrderNetwork: 'testnet' | 'mainnet' | null
  activeRequestPaid: boolean
  activeRequestPaidTxHash: string | null
  businessOrders: SafePayBusinessOrderRecord[]
  blockchainPaymentChecking: boolean
  blockchainPaymentError: string | null
  incomingSafePayRequestError: string | null

  paymentReview: PaymentReviewLike | null
  reviewStatus: ReviewStatus
  reviewError: string | null
  proofPublicInputs: string[]

  nimiqConnected: boolean
  nimiqConnecting: boolean
  nimiqAccount: string | null
  paymentStatus: PaymentStatusLike

  onManualPaymentLinkChange: (value: string) => void
  onParsePaymentLink: () => void
  onStartQrScanner: () => void
  onStopQrScanner: () => void
  onVerifyBeforePayment: () => void
  onSendPayment: () => void
  onConnectNimiq: () => void
  onDisconnectNimiq: () => void
  onResetFlow: () => void
  onClearCurrentBusinessRequest: () => void
  onClearActiveSafePayRequest: () => void
  onCreateRequest: (orderDraft?: SafePayOrderDraft) => void
  onLoadCreatedRequestForReview: () => void
  onRefreshBusinessOrders: () => void
  onOpenBusinessOrder: (record: SafePayBusinessOrderRecord) => void | Promise<void>
  onCheckBusinessOrderPayment: (record: SafePayBusinessOrderRecord) => void | Promise<void>
  onClearBusinessOrders: () => void
}

function shortenAddress(address: string) {
  return shortRecipient(address)
}

function shortHash(value?: string) {
  return shortValue(value) ?? '—'
}

function formatOrderExpiration(value?: string) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: '2-digit',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function getVerificationTitle(reviewStatus: ReviewStatus) {
  if (reviewStatus === 'verified') return 'SafePay verified'
  if (reviewStatus === 'verifying') return 'Checking request...'
  if (reviewStatus === 'failed') return 'Payment blocked'
  return 'Ready to verify'
}

function getVerificationDescription(reviewStatus: ReviewStatus) {
  if (reviewStatus === 'verified') {
    return 'This payment request matches the verified private intent.'
  }

  if (reviewStatus === 'verifying') {
    return 'Checking the payment request before enabling PAY.'
  }

  if (reviewStatus === 'failed') {
    return 'This request could not be verified. Do not continue with this payment.'
  }

  return 'Review this request, then verify it before paying.'
}

function getBusinessOrderStatusLabel(status: SafePayBusinessOrderRecord['status']) {
  if (status === 'paid') return 'Paid'
  if (status === 'expired') return 'Expired'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'draft') return 'Draft'
  return 'Active'
}

function getBusinessOrderStatusNote(status: SafePayBusinessOrderRecord['status']) {
  if (status === 'paid') return 'Payment confirmed on blockchain'
  if (status === 'expired') return 'Request expired without payment'
  if (status === 'cancelled') return 'Request cancelled by business'
  if (status === 'active') return 'Waiting for payment confirmation'
  return 'Draft request'
}

export function NimiqPayFlowShell({
  manualPaymentLink,
  scannerRunning,
  scannerError,
  videoRef,
  createdRequestQr,
  createdRequestLink,
  createdRequestError,
  activeSafePayOrder,
  activeSafePayOrderRecipient,
  activeSafePayOrderNetwork,
  activeRequestPaid,
  activeRequestPaidTxHash,
  businessOrders,
  blockchainPaymentChecking,
  blockchainPaymentError,
  incomingSafePayRequestError,
  paymentReview,
  reviewStatus,
  reviewError,
  proofPublicInputs = [],

  nimiqConnected,
  nimiqConnecting,
  nimiqAccount,
  paymentStatus = {},

  onManualPaymentLinkChange,
  onParsePaymentLink,
  onStartQrScanner,
  onStopQrScanner,
  onVerifyBeforePayment,
  onSendPayment,
  onConnectNimiq,
  onDisconnectNimiq,
  onResetFlow,
  onClearCurrentBusinessRequest,
  onClearActiveSafePayRequest,
  onCreateRequest,
  onLoadCreatedRequestForReview,
  onRefreshBusinessOrders,
  onOpenBusinessOrder,
  onClearBusinessOrders,
}: NimiqPayFlowShellProps) {
  const [screen, setScreen] = useState<PayScreen>('home')
  const [, setAutoVerifyStarted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showCreateQr, setShowCreateQr] = useState(false)
  const [showQrFullscreen, setShowQrFullscreen] = useState(false)
  const [showOrderReceipt, setShowOrderReceipt] = useState(false)
  const [businessName, setBusinessName] = useState('SafePay Merchant')
  const [orderItems, setOrderItems] = useState<SafePayOrderItem[]>([
    createEmptyOrderItem(),
  ])
  const [expiresInMinutes, setExpiresInMinutes] = useState(15)
  const [returningToNimiqPay, setReturningToNimiqPay] = useState(false)

  const autoVerifyLockRef = useRef(false)
  const incomingRequestAutoOpenRef = useRef(false)
  const pendingRequestNavigationRef = useRef<'scan' | 'manual' | null>(null)
  const verifyAfterReceiptRef = useRef(false)
  const savedActivityIdsRef = useRef<Set<string>>(new Set())
  const generatedQrPanelRef = useRef<HTMLDivElement | null>(null)

  const [showActivity, setShowActivity] = useState(false)
  const [showBusinessOrders, setShowBusinessOrders] = useState(false)
  const [activityItems, setActivityItems] = useState<SafePayActivityItem[]>(() =>
    getSafePayActivity(),
  )
  const [lastActivityId, setLastActivityId] = useState<string | null>(null)

  const amount = paymentReview
    ? Number(paymentReview.amountNim).toFixed(2)
    : '0.00'

  const txHash = paymentStatus.txHash ?? paymentStatus.transactionHash ?? null
  const paidTxHash = activeRequestPaidTxHash ?? txHash
  const activeOrderIsPaid =
    activeRequestPaid || activeSafePayOrder?.status === 'paid'

  const intentHash = paymentReview?.intentHash ?? proofPublicInputs[0] ?? null
  const nullifier = paymentReview?.nullifier ?? proofPublicInputs[1] ?? null

  const canPay =
    !!paymentReview &&
    reviewStatus === 'verified' &&
    nimiqConnected &&
    !activeOrderIsPaid &&
    !blockchainPaymentChecking &&
    !paymentReview.isExpired &&
    !paymentStatus.sending &&
    !paymentStatus.sent

  const walletStatusLabel = nimiqConnected
    ? 'Disconnect'
    : nimiqConnecting
      ? 'Connecting to Nimiq Pay...'
      : 'Connect with Nimiq Pay'

  const walletDisplayName =
    nimiqConnected && nimiqAccount
      ? shortRecipient(nimiqAccount)
      : 'Wallet not connected'

  const orderTotalNim = calculateOrderTotalNim(orderItems)

  const orderCanGenerate =
    nimiqConnected &&
    !!nimiqAccount &&
    businessName.trim().length > 0 &&
    hasValidOrderItems(orderItems)

  const latestPaidBusinessOrder =
    [...businessOrders]
      .filter((order) => order.status === 'paid')
      .sort((a, b) => {
        const aTime = new Date(a.paidAt ?? a.createdAt).getTime()
        const bTime = new Date(b.paidAt ?? b.createdAt).getTime()

        return bTime - aTime
      })[0] ?? null

  useEffect(() => {
    if (!activeSafePayOrder) {
      incomingRequestAutoOpenRef.current = false
      return
    }

    if (paymentReview) {
      return
    }

    const pendingNavigation = pendingRequestNavigationRef.current

    if (
      pendingNavigation &&
      ((pendingNavigation === 'scan' && screen === 'scan') ||
        (pendingNavigation === 'manual' && screen === 'manual'))
    ) {
      pendingRequestNavigationRef.current = null
      onStopQrScanner()
      setShowOrderReceipt(false)
      setScreen('personal')
      return
    }

    if (createdRequestQr || createdRequestLink) {
      return
    }

    if (screen === 'home') {
      if (incomingRequestAutoOpenRef.current) {
        return
      }

      incomingRequestAutoOpenRef.current = true
      setScreen('personal')
    }
  }, [
    activeSafePayOrder,
    createdRequestLink,
    createdRequestQr,
    onStopQrScanner,
    paymentReview,
    screen,
  ])

  useEffect(() => {
    if (paymentReview) {
      setScreen('preview')
    }
  }, [paymentReview])

  useEffect(() => {
    if (!createdRequestQr || screen !== 'business' || !showCreateQr) {
      return
    }

    const timer = window.setTimeout(() => {
      generatedQrPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)

    return () => {
      window.clearTimeout(timer)
    }
  }, [createdRequestQr, screen, showCreateQr])

  useEffect(() => {
    if (!paymentReview) {
      setAutoVerifyStarted(false)
      setShowDetails(false)
      autoVerifyLockRef.current = false
    }
  }, [paymentReview])

  useEffect(() => {
    if (screen !== 'preview' || !paymentReview) {
      return
    }

    if (
      !verifyAfterReceiptRef.current ||
      reviewStatus !== 'idle' ||
      autoVerifyLockRef.current
    ) {
      setAutoVerifyStarted(false)
      autoVerifyLockRef.current = false
      return
    }

    verifyAfterReceiptRef.current = false
    autoVerifyLockRef.current = true
    setAutoVerifyStarted(true)

    const timer = window.setTimeout(() => {
      onVerifyBeforePayment()
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [screen, paymentReview, reviewStatus, onVerifyBeforePayment])

  useEffect(() => {
    if (!paymentStatus.sent) return

    setScreen('sent')
    setReturningToNimiqPay(true)

    const timer = window.setTimeout(() => {
      closeFlow()
    }, 1500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [paymentStatus.sent])

  useEffect(() => {
    if (!paymentReview) return

    if (reviewStatus !== 'verified' && reviewStatus !== 'failed') {
      return
    }

    const id = [
      intentHash ?? 'no-intent',
      paymentReview.recipient,
      paymentReview.amountNim,
      paymentReview.network ?? 'Nimiq',
      paymentReview.expiresAtLabel ?? 'no-expiration',
      reviewStatus,
    ].join(':')

    if (savedActivityIdsRef.current.has(id)) {
      return
    }

    savedActivityIdsRef.current.add(id)

    const item: SafePayActivityItem = {
      id,
      createdAt: new Date().toISOString(),
      amountNim: Number(paymentReview.amountNim).toFixed(2),
      recipientShort: shortRecipient(paymentReview.recipient),
      network: paymentReview.network ?? 'Nimiq',
      verificationStatus: reviewStatus,
      paymentStatus: 'not_paid',
      intentHashShort: shortValue(intentHash),
    }

    saveSafePayActivity(item)
    setActivityItems(getSafePayActivity())

    if (reviewStatus === 'verified') {
      setLastActivityId(id)
    }
  }, [intentHash, paymentReview, reviewStatus])

  useEffect(() => {
    if (!paymentStatus.sent || !lastActivityId) return

    updateSafePayActivityPayment(
      lastActivityId,
      shortValue(txHash),
      nimiqAccount ? shortRecipient(nimiqAccount) : undefined,
    )
    setActivityItems(getSafePayActivity())
  }, [paymentStatus.sent, lastActivityId, txHash, nimiqAccount])

  function updateOrderItem(
    itemId: string,
    field: keyof SafePayOrderItem,
    value: string | number,
  ) {
    setOrderItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    )
  }

  function addOrderItem() {
    setOrderItems((current) => [...current, createEmptyOrderItem()])
  }

  function removeOrderItem(itemId: string) {
    setOrderItems((current) => {
      if (current.length === 1) {
        return [createEmptyOrderItem()]
      }

      return current.filter((item) => item.id !== itemId)
    })
  }

  function generateOrderQr() {
    if (!orderCanGenerate) return

    onCreateRequest({
      businessName,
      items: orderItems,
      expiresInMinutes,
    })
  }

  function openNewBusinessRequest() {
    onResetFlow()
    onStopQrScanner()
    onClearCurrentBusinessRequest()

    setBusinessName('')
    setOrderItems([createEmptyOrderItem()])
    setExpiresInMinutes(15)

    setShowOrderReceipt(false)
    setShowActivity(false)
    setShowBusinessOrders(false)
    setShowQrFullscreen(false)
    setShowDetails(false)
    setShowCreateQr(true)

    setAutoVerifyStarted(false)
    autoVerifyLockRef.current = false

    setScreen('business')
  }

  function openBusinessOrdersSheet() {
    onRefreshBusinessOrders()
    setShowBusinessOrders(true)
  }

  async function handleOpenBusinessReceipt(record: SafePayBusinessOrderRecord) {
    await onOpenBusinessOrder(record)

    setShowBusinessOrders(false)
    setShowCreateQr(false)
    setShowQrFullscreen(false)
    setShowOrderReceipt(true)
    setScreen('business')
  }

  function closeFlow() {
    onStopQrScanner()
    setScreen('home')
    setAutoVerifyStarted(false)
    setShowDetails(false)
    setShowActivity(false)
    setShowBusinessOrders(false)
    setShowCreateQr(false)
    setShowQrFullscreen(false)
    setShowOrderReceipt(false)
    setReturningToNimiqPay(false)
    autoVerifyLockRef.current = false
    pendingRequestNavigationRef.current = null
    verifyAfterReceiptRef.current = false
    onResetFlow()
  }

  function goBack() {
    if (screen === 'business' || screen === 'personal') {
      setScreen('home')
      return
    }

    if (screen === 'scan' || screen === 'manual') {
      onStopQrScanner()
      setScreen('personal')
      return
    }

    if (screen === 'preview') {
      onStopQrScanner()
      setScreen('personal')
      setAutoVerifyStarted(false)
      setShowDetails(false)
      autoVerifyLockRef.current = false
      pendingRequestNavigationRef.current = null
      verifyAfterReceiptRef.current = false
      onResetFlow()
    }
  }

  function resetTransientSheetsForNewInput() {
    setShowOrderReceipt(false)
    setShowActivity(false)
    setShowBusinessOrders(false)
    setShowCreateQr(false)
    setShowQrFullscreen(false)
    setShowDetails(false)
    setAutoVerifyStarted(false)
    autoVerifyLockRef.current = false
    verifyAfterReceiptRef.current = false
  }

  function openQrScanner() {
    onStopQrScanner()
    onResetFlow()
    onClearActiveSafePayRequest()
    resetTransientSheetsForNewInput()

    pendingRequestNavigationRef.current = 'scan'
    setScreen('scan')

    window.setTimeout(() => {
      onStartQrScanner()
    }, 500)
  }

  function openManualEntry() {
    onStopQrScanner()
    onResetFlow()
    onClearActiveSafePayRequest()
    resetTransientSheetsForNewInput()

    pendingRequestNavigationRef.current = null
    setScreen('manual')
  }

  function handleManualContinue() {
    pendingRequestNavigationRef.current = 'manual'
    onParsePaymentLink()
  }

  function handleMainAction() {
    if (!paymentReview) return

    if (reviewStatus === 'idle' || reviewStatus === 'failed') {
      onVerifyBeforePayment()
      return
    }

    if (reviewStatus === 'verifying') {
      return
    }

    if (!nimiqConnected) {
      onConnectNimiq()
      return
    }

    if (reviewStatus === 'verified') {
      onSendPayment()
    }
  }

  function getMainButtonLabel() {
    if (paymentStatus.sending) return 'Opening Nimiq Pay...'
    if (paymentStatus.sent) return 'Payment Sent'
    if (activeOrderIsPaid) return 'Already paid'
    if (blockchainPaymentChecking) return 'Checking payment...'
    if (!paymentReview) return 'PAY'
    if (reviewStatus === 'verifying') return 'Checking request...'
    if (reviewStatus === 'failed') return 'Try verification again'
    if (reviewStatus !== 'verified') return 'Review and verify'
    if (!nimiqConnected) return nimiqConnecting ? 'Connecting...' : 'Connect Nimiq Pay'
    return 'PAY'
  }

  return (
    <main className="nq-pay-shell">
      <div
        className="nq-pay-slider"
        style={{
          transform:
            screen === 'home'
              ? 'translateX(0)'
              : screen === 'business'
                ? 'translateX(-100vw)'
                : screen === 'personal'
                  ? 'translateX(-200vw)'
                  : screen === 'scan'
                    ? 'translateX(-300vw)'
                    : screen === 'manual'
                      ? 'translateX(-400vw)'
                      : screen === 'preview'
                        ? 'translateX(-500vw)'
                        : 'translateX(-600vw)',
        }}
      >
        <section className="nq-pay-screen">
          <div className="nq-screen-content nq-home-content">
            <div className="nq-app-logo">
              <img
                src={appLogoUrl}
                alt="SafePay ZK"
                className="nq-app-logo-image"
              />
            </div>

            <h1 className="nq-app-name">SafePay ZK</h1>

            <p className="nq-app-tagline">
              Create verified payment requests or verify before you pay.
            </p>

            {incomingSafePayRequestError && (
              <div className="nq-incoming-request-error">
                {incomingSafePayRequestError}
              </div>
            )}

            <div className="nq-mode-grid">
              <button
                className="nq-mode-card business"
                type="button"
                onClick={() => setScreen('business')}
              >
                <div className="nq-mode-title">Request Payment</div>

                <div className="nq-mode-card-content">
                  <p>Create payment requests, generate QR codes, and receive NIM.</p>
                </div>
              </button>

              <button
                className="nq-mode-card personal"
                type="button"
                onClick={() => setScreen('personal')}
              >
                <div className="nq-mode-title">Verify Payment</div>

                <div className="nq-mode-card-content">
                  <p>Scan, review, verify, and pay SafePay requests.</p>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <div className="nq-screen-content nq-mode-content">
            <div className="nq-mode-page-hero">
              <div>
                <h2>Request Payment</h2>
                <p>Create payment requests, generate QR codes, and receive NIM.</p>
              </div>
            </div>

            <button
              className={`nq-wallet-status ${nimiqConnected ? 'connected disconnect' : ''}`}
              onClick={nimiqConnected ? onDisconnectNimiq : onConnectNimiq}
              disabled={nimiqConnecting}
            >
              <span className="nq-wallet-dot" />
              {walletStatusLabel}
            </button>

            {nimiqConnected && (
              <div className="nq-wallet-card connected">
                <NimiqAccountIcon address={nimiqAccount} />

                <div>
                  <span>Receiving address</span>
                  <strong>{walletDisplayName}</strong>
                </div>
              </div>
            )}

            {latestPaidBusinessOrder && (
              <div className="nq-incoming-request-card">
                <div>
                  <span>Payment received</span>
                  <strong>{latestPaidBusinessOrder.businessName}</strong>
                </div>

                <div className="nq-incoming-request-meta">
                  <span>{latestPaidBusinessOrder.orderNumber}</span>
                  <strong>{latestPaidBusinessOrder.totalNim} NIM</strong>
                </div>

                <div className="nq-incoming-request-meta">
                  <span>Paid on {latestPaidBusinessOrder.network}</span>
                  <strong>Tx {shortHash(latestPaidBusinessOrder.txHash)}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenBusinessReceipt(latestPaidBusinessOrder)}
                >
                  View receipt
                </button>
              </div>
            )}

            <div className="nq-mode-action-list">
              <button
                className="nq-home-create-btn"
                type="button"
                onClick={openNewBusinessRequest}
              >
                Create payment request
              </button>
            </div>

            <div className="nq-secondary-actions">
              <button
                className="nq-activity-link"
                type="button"
                onClick={openBusinessOrdersSheet}
              >
                Order history
              </button>
            </div>

            <div className="nq-mode-note">
              The customer scans your QR, verifies the request, and pays with Nimiq Pay.
            </div>
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            Back
          </button>

          <div className="nq-screen-content nq-mode-content">
            <div className="nq-mode-page-hero">

              <div>
                <h2>Verify Payment</h2>
                <p>Scan, review, verify, and pay SafePay requests.</p>
              </div>
            </div>

            <button
              className={`nq-wallet-status ${nimiqConnected ? 'connected disconnect' : ''}`}
              onClick={nimiqConnected ? onDisconnectNimiq : onConnectNimiq}
              disabled={nimiqConnecting}
            >
              <span className="nq-wallet-dot" />
              {walletStatusLabel}
            </button>

            {nimiqConnected && (
              <div className="nq-wallet-card connected">
                <NimiqAccountIcon address={nimiqAccount} />

                <div>
                  <span>Payment wallet</span>
                  <strong>{walletDisplayName}</strong>
                </div>
              </div>
            )}

            {activeSafePayOrder && (
              <div className="nq-incoming-request-card">
                <div>
                  <span>
                    {activeOrderIsPaid
                      ? 'Paid SafePay request'
                      : 'Incoming SafePay request'}
                  </span>
                  <strong>{activeSafePayOrder.businessName}</strong>
                </div>

                <div className="nq-incoming-request-meta">
                  <span>{activeSafePayOrder.orderNumber}</span>
                  <strong>{activeSafePayOrder.totalNim} NIM</strong>
                </div>

                <button type="button" onClick={() => setShowOrderReceipt(true)}>
                  {activeOrderIsPaid ? 'Already paid' : 'View order'}
                </button>
              </div>
            )}

            <div className="nq-mode-action-list">
              <button
                className="nq-home-pay-btn"
                type="button"
                onClick={openQrScanner}
              >
                Scan QR
              </button>

              <button
                className="nq-home-create-btn"
                type="button"
                onClick={openManualEntry}
              >
                Enter request manually
              </button>
            </div>

            <div className="nq-secondary-actions">
              <button
                className="nq-activity-link"
                type="button"
                onClick={() => {
                  setActivityItems(getSafePayActivity())
                  setShowActivity(true)
                }}
              >
                Verification activity
              </button>
            </div>
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <div className="nq-screen-content nq-scan-content">
            <h1 className="nq-screen-title">Scan QR Code</h1>
            <p className="nq-screen-subtitle">
              Scan a SafePay request and verify it before paying.
            </p>

            <div className={`nq-qr-frame ${scannerRunning ? 'active' : ''}`}>
              <div className="nq-qr-corners">
                {!scannerRunning && (
                  <div className="nq-qr-placeholder">
                    <span>QR</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  className={`nq-video-preview ${scannerRunning ? 'active' : ''}`}
                  autoPlay
                  muted
                  playsInline
                />
              </div>
            </div>

            {scannerRunning && (
              <button className="nq-primary-mini-btn" onClick={onStopQrScanner}>
                Stop scanner
              </button>
            )}

            {scannerError && <div className="nq-error-text">{scannerError}</div>}
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <h1 className="nq-header-title">Enter payment request</h1>

          <div className="nq-screen-content nq-manual-content">
            <textarea
              className="nq-request-input"
              placeholder="Paste or type the invoice here"
              value={manualPaymentLink}
              onChange={(event) => onManualPaymentLinkChange(event.target.value)}
            />

            <button
              className="nq-primary-btn"
              onClick={handleManualContinue}
              disabled={!manualPaymentLink.trim()}
            >
              Continue
            </button>

            {reviewError && <div className="nq-error-text">{reviewError}</div>}
          </div>
        </section>

        <section className="nq-pay-screen">
          <button className="nq-back-btn" onClick={goBack}>
            ←
          </button>

          <h1 className="nq-header-title">Payment preview</h1>

          <div className="nq-screen-content nq-preview-content">
            <div className="nq-amount-block">
              <div className="nq-amount">{amount}</div>
              <div className="nq-currency">NIM</div>
            </div>

            <div className={`nq-wallet-preview ${nimiqConnected ? 'connected' : ''}`}>
              <span className="nq-wallet-dot" />
              <strong>{walletStatusLabel}</strong>
            </div>

            <div className={`nq-safepay-status status-${reviewStatus}`}>
              <div className="nq-safepay-icon">
                {reviewStatus === 'verified'
                  ? '✓'
                  : reviewStatus === 'failed'
                    ? '!'
                    : '…'}
              </div>

              <div>
                <strong>{getVerificationTitle(reviewStatus)}</strong>
                <span>{getVerificationDescription(reviewStatus)}</span>
              </div>
            </div>

            <div className="nq-preview-card">
              <div className="nq-preview-row">
                <span>Recipient</span>
                <strong>
                  {paymentReview
                    ? shortenAddress(paymentReview.recipient)
                    : 'Not loaded'}
                </strong>
              </div>

              <div className="nq-preview-row">
                <span>Request</span>
                <strong>{paymentReview?.memoPublic ?? 'SafePay request'}</strong>
              </div>

              <div className="nq-preview-row">
                <span>Network</span>
                <strong>{paymentReview?.network ?? 'Nimiq'}</strong>
              </div>

              <div className="nq-preview-row">
                <span>Expires</span>
                <strong>{paymentReview?.expiresAtLabel ?? '—'}</strong>
              </div>
            </div>

            <button
              className="nq-details-toggle"
              onClick={() => setShowDetails((value) => !value)}
            >
              {showDetails ? 'Hide technical details' : 'View technical details'}
            </button>

            {showDetails && (
              <div className="nq-technical-card">
                <div className="nq-preview-row">
                  <span>Proof status</span>
                  <strong>{reviewStatus === 'verified' ? 'Valid' : reviewStatus}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Intent hash</span>
                  <strong>{shortHash(intentHash ?? undefined)}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Nullifier</span>
                  <strong>{shortHash(nullifier ?? undefined)}</strong>
                </div>

                <div className="nq-preview-row">
                  <span>Verifier</span>
                  <strong>{reviewStatus === 'verified' ? 'Passed' : 'Pending'}</strong>
                </div>
              </div>
            )}

            {reviewError && <div className="nq-error-text">{reviewError}</div>}
            {paymentStatus.error && (
              <div className="nq-error-text">{paymentStatus.error}</div>
            )}
          </div>

          <div className="nq-bottom-action">
            <button
              className="nq-pay-btn"
              onClick={handleMainAction}
              disabled={
                !paymentReview ||
                paymentStatus.sending ||
                paymentStatus.sent ||
                activeOrderIsPaid ||
                blockchainPaymentChecking ||
                reviewStatus === 'verifying' ||
                (reviewStatus === 'verified' && !canPay && nimiqConnected)
              }
            >
              {getMainButtonLabel()}
            </button>
          </div>
        </section>

        <section className="nq-pay-screen">
          <div className="nq-screen-content nq-sent-content">
            <div className="nq-sent-icon">✓</div>
            <h1 className="nq-screen-title">Payment sent</h1>
            <p className="nq-screen-subtitle">
              {returningToNimiqPay
                ? 'Returning to Nimiq Pay...'
                : 'SafePay verification completed.'}
            </p>

            {txHash && (
              <div className="nq-sent-hash">
                <span>Transaction</span>
                <code>{shortHash(txHash)}</code>
              </div>
            )}

            <button className="nq-link-btn" onClick={closeFlow}>
              Back to SafePay
            </button>
          </div>
        </section>
      </div>

      {showOrderReceipt && activeSafePayOrder && (
        <div className="nq-activity-overlay">
          <div className="nq-order-receipt-sheet">
            <div className="nq-activity-header">
              <div>
                <h2>Order receipt</h2>
                <p>
                  {activeOrderIsPaid
                    ? 'This wallet has already paid this SafePay request.'
                    : screen === 'business'
                      ? 'This payment request is ready for the customer to scan.'
                      : 'Review this SafePay request before verification.'}
                </p>
              </div>

              <button
                className="nq-activity-close"
                onClick={() => setShowOrderReceipt(false)}
              >
                ×
              </button>
            </div>

            <div className="nq-receipt-hero">
              <span>{activeSafePayOrder.businessName}</span>
              <strong>{activeSafePayOrder.totalNim} NIM</strong>
              <small>{activeSafePayOrder.orderNumber}</small>
            </div>

            <div
              className={`nq-receipt-status-badge status-${activeOrderIsPaid ? 'paid' : activeSafePayOrder.status
                }`}
            >
              {activeOrderIsPaid
                ? 'Paid'
                : activeSafePayOrder.status === 'expired'
                  ? 'Expired'
                  : activeSafePayOrder.status === 'cancelled'
                    ? 'Cancelled'
                    : 'Active'}
            </div>

            {createdRequestQr && (
              <div className="nq-receipt-qr-card">
                <img
                  src={createdRequestQr}
                  alt="SafePay request QR"
                  className="nq-receipt-qr-image"
                />

                <button
                  className="nq-link-btn nq-fullscreen-qr-btn"
                  type="button"
                  onClick={() => setShowQrFullscreen(true)}
                >
                  View QR full screen
                </button>
              </div>
            )}

            <div className="nq-receipt-section">
              <div className="nq-receipt-section-title">Items</div>

              {activeSafePayOrder.items.map((item) => (
                <div className="nq-receipt-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity} × {Number(item.unitPriceNim).toFixed(2)} NIM
                    </span>
                  </div>

                  <strong>
                    {(Number(item.quantity) * Number(item.unitPriceNim)).toFixed(2)} NIM
                  </strong>
                </div>
              ))}
            </div>

            <div className="nq-receipt-total">
              <span>Total</span>
              <strong>{activeSafePayOrder.totalNim} NIM</strong>
            </div>

            <div className="nq-receipt-meta-card">
              <div>
                <span>Recipient</span>
                <strong>
                  {activeSafePayOrderRecipient
                    ? shortenAddress(activeSafePayOrderRecipient)
                    : '—'}
                </strong>
              </div>

              <div>
                <span>Network</span>
                <strong>{activeSafePayOrderNetwork ?? '—'}</strong>
              </div>

              <div>
                <span>Expires</span>
                <strong>{formatOrderExpiration(activeSafePayOrder.expiresAt)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{activeOrderIsPaid ? 'paid' : activeSafePayOrder.status}</strong>
              </div>

              {paidTxHash && (
                <div>
                  <span>Paid tx</span>
                  <strong>{shortHash(paidTxHash)}</strong>
                </div>
              )}
            </div>

            {screen === 'business' || activeOrderIsPaid ? (
              <button
                className="nq-primary-btn"
                type="button"
                onClick={() => setShowOrderReceipt(false)}
              >
                {activeOrderIsPaid ? 'Already paid' : 'Close'}
              </button>
            ) : (
              <button
                className="nq-primary-btn"
                type="button"
                onClick={() => {
                  verifyAfterReceiptRef.current = true
                  setShowOrderReceipt(false)
                  onLoadCreatedRequestForReview()
                }}
              >
                Review and verify
              </button>
            )}
          </div>
        </div>
      )}

      {showCreateQr && (
        <div className="nq-activity-overlay">
          <div className="nq-create-qr-sheet">
            <div className="nq-activity-header">
              <div>
                <h2>Create payment request</h2>
                <p>Add items, generate a QR, and let the customer verify before paying.</p>
              </div>

              <button
                className="nq-activity-close"
                onClick={() => {
                  setShowCreateQr(false)
                  setShowQrFullscreen(false)
                }}
              >
                ×
              </button>
            </div>

            <div className="nq-pos-form">
              {!nimiqConnected && (
                <div className="nq-pos-warning">
                  Connect with Nimiq Pay first. Your connected address will receive this payment.
                </div>
              )}

              <label className="nq-pos-label">
                Business name
                <input
                  className="nq-pos-input"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Example: LoonieTaco"
                />
              </label>

              <div className="nq-pos-section-title">
                <span>Order items</span>
                <button type="button" onClick={addOrderItem}>
                  Add item
                </button>
              </div>

              <div className="nq-pos-items">
                {orderItems.map((item, index) => (
                  <div className="nq-pos-item" key={item.id}>
                    <div className="nq-pos-item-header">
                      <strong>Item {index + 1}</strong>

                      <button type="button" onClick={() => removeOrderItem(item.id)}>
                        Remove
                      </button>
                    </div>

                    <label className="nq-pos-label">
                      Item name
                      <input
                        className="nq-pos-input"
                        value={item.name}
                        onChange={(event) =>
                          updateOrderItem(item.id, 'name', event.target.value)
                        }
                        placeholder="Example: Taco al pastor"
                      />
                    </label>

                    <div className="nq-pos-item-grid">
                      <label className="nq-pos-label">
                        Qty
                        <input
                          className="nq-pos-input"
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateOrderItem(item.id, 'quantity', event.target.value)
                          }
                        />
                      </label>

                      <label className="nq-pos-label">
                        Price NIM
                        <input
                          className="nq-pos-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPriceNim}
                          onChange={(event) =>
                            updateOrderItem(item.id, 'unitPriceNim', event.target.value)
                          }
                          placeholder="5.00"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <label className="nq-pos-label">
                Expires in
                <select
                  className="nq-pos-input"
                  value={expiresInMinutes}
                  onChange={(event) => setExpiresInMinutes(Number(event.target.value))}
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </label>

              <div className="nq-pos-total-card">
                <span>Total</span>
                <strong>{orderTotalNim} NIM</strong>
              </div>

              <button
                className="nq-primary-btn"
                onClick={generateOrderQr}
                disabled={!orderCanGenerate}
              >
                Generate SafePay QR
              </button>
            </div>

            {createdRequestQr && (
              <div className="nq-generated-qr-panel" ref={generatedQrPanelRef}>
                <img
                  src={createdRequestQr}
                  alt="Generated SafePay QR"
                  className="nq-generated-qr-image"
                />

                <button
                  className="nq-link-btn nq-fullscreen-qr-btn"
                  type="button"
                  onClick={() => setShowQrFullscreen(true)}
                >
                  View QR full screen
                </button>

                <div className="nq-generated-qr-info">
                  <strong>QR ready</strong>
                  <span>
                    Ask the customer to scan this QR. You can view the receipt from Business.
                  </span>
                </div>

                {activeSafePayOrder && (
                  <div className="nq-order-summary-card">
                    <div className="nq-order-summary-header">
                      <div>
                        <span>Order</span>
                        <strong>{activeSafePayOrder.orderNumber}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>
                          {activeOrderIsPaid ? 'paid' : activeSafePayOrder.status}
                        </strong>
                      </div>
                    </div>

                    <div className="nq-order-business">
                      <span>Business</span>
                      <strong>{activeSafePayOrder.businessName}</strong>
                    </div>

                    <div className="nq-order-items-list">
                      {activeSafePayOrder.items.map((item) => (
                        <div className="nq-order-line-item" key={item.id}>
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <strong>
                            {(Number(item.quantity) * Number(item.unitPriceNim)).toFixed(2)} NIM
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="nq-order-total-line">
                      <span>Total</span>
                      <strong>{activeSafePayOrder.totalNim} NIM</strong>
                    </div>

                    <div className="nq-order-expiration-line">
                      Expires {formatOrderExpiration(activeSafePayOrder.expiresAt)}
                    </div>
                  </div>
                )}

                <button
                  className="nq-primary-btn"
                  type="button"
                  onClick={() => {
                    setShowCreateQr(false)
                    setShowQrFullscreen(false)
                    setScreen('business')
                  }}
                >
                  Done
                </button>
              </div>
            )}

            {createdRequestLink && (
              <details className="nq-created-link-details">
                <summary>View request link</summary>
                <code>{createdRequestLink}</code>
              </details>
            )}

            {createdRequestError && (
              <div className="nq-error-text">{createdRequestError}</div>
            )}
          </div>
        </div>
      )}

      {showQrFullscreen && createdRequestQr && (
        <div className="nq-qr-fullscreen-overlay">
          <div className="nq-qr-fullscreen-sheet">
            <button
              className="nq-qr-fullscreen-close"
              type="button"
              onClick={() => setShowQrFullscreen(false)}
            >
              ×
            </button>

            <div className="nq-qr-fullscreen-header">
              <span>SafePay request QR</span>
              <strong>Scan to verify and pay</strong>
            </div>

            <img
              src={createdRequestQr}
              alt="SafePay request QR full screen"
              className="nq-qr-fullscreen-image"
            />

            <p className="nq-qr-fullscreen-note">
              Ask the customer to scan this QR with SafePay inside Nimiq Pay.
            </p>
          </div>
        </div>
      )}

      {showBusinessOrders && (
        <div className="nq-activity-overlay">
          <div className="nq-activity-sheet">
            <div className="nq-activity-header">
              <div>
                <h2>Business orders</h2>
                <p>
                  {blockchainPaymentChecking
                    ? 'Auto-checking active orders on blockchain...'
                    : 'Payment requests auto-update when paid or expired.'}
                </p>
              </div>

              <button
                className="nq-activity-close"
                onClick={() => setShowBusinessOrders(false)}
              >
                ×
              </button>
            </div>

            {businessOrders.length === 0 ? (
              <div className="nq-empty-activity">
                No payment requests created yet.
              </div>
            ) : (
              <div className="nq-activity-list">
                {businessOrders.map((order) => (
                  <div className="nq-activity-item" key={order.id}>
                    <div className="nq-activity-main">
                      <strong>{order.totalNim} NIM</strong>
                      <span>{order.orderNumber}</span>
                    </div>

                    <div className="nq-activity-meta">
                      <span>Business: {order.businessName}</span>
                      <span>Status: {getBusinessOrderStatusLabel(order.status)}</span>
                      <span>{getBusinessOrderStatusNote(order.status)}</span>
                      <span>Recipient: {shortenAddress(order.recipientAddress)}</span>
                      <span>Expires: {formatOrderExpiration(order.expiresAt)}</span>
                      {order.txHash && <span>Tx: {shortHash(order.txHash)}</span>}
                    </div>

                    <button
                      className="nq-primary-mini-btn"
                      type="button"
                      onClick={() => handleOpenBusinessReceipt(order)}
                    >
                      View receipt
                    </button>

                  </div>
                ))}
              </div>
            )}

            {blockchainPaymentError && (
              <div className="nq-error-text">{blockchainPaymentError}</div>
            )}

            {businessOrders.length > 0 && (
              <button
                className="nq-clear-activity"
                onClick={() => {
                  onClearBusinessOrders()
                  setShowBusinessOrders(false)
                }}
              >
                Clear order history
              </button>
            )}
          </div>
        </div>
      )}

      {showActivity && (
        <div className="nq-activity-overlay">
          <div className="nq-activity-sheet">
            <div className="nq-activity-header">
              <div>
                <h2>SafePay activity</h2>
                <p>Local verification history only.</p>
              </div>

              <button
                className="nq-activity-close"
                onClick={() => setShowActivity(false)}
              >
                ×
              </button>
            </div>

            {activityItems.length === 0 ? (
              <div className="nq-empty-activity">
                No SafePay verifications yet.
              </div>
            ) : (
              <div className="nq-activity-list">
                {activityItems.map((item) => (
                  <div className="nq-activity-item" key={item.id}>
                    <div className="nq-activity-main">
                      <strong>{item.amountNim} NIM</strong>
                      <span>{item.recipientShort}</span>
                    </div>

                    <div className="nq-activity-meta">
                      <span>Verification: {item.verificationStatus}</span>
                      <span>
                        Payment:{' '}
                        {item.verificationStatus === 'failed'
                          ? 'blocked'
                          : item.paymentStatus}
                      </span>
                      {item.intentHashShort && (
                        <span>Intent: {item.intentHashShort}</span>
                      )}
                      {item.payerShort && <span>Payer: {item.payerShort}</span>}
                      {item.txHashShort && <span>Tx: {item.txHashShort}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activityItems.length > 0 && (
              <button
                className="nq-clear-activity"
                onClick={() => {
                  clearSafePayActivity()
                  savedActivityIdsRef.current.clear()
                  setActivityItems([])
                  setLastActivityId(null)
                }}
              >
                Clear activity
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
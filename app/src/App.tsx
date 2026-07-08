import { useEffect, useRef, useState } from 'react'
import './App.css'


import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useQrScanner } from './hooks/useQrScanner'
import { useSafePayVerification } from './hooks/useSafePayVerification'
import { usePaymentReview } from './hooks/usePaymentReview'

import {
  parseSafePayPaymentLink,
  type SafePayQrPayload,
} from './lib/safepayQrPayload'
import { createQrCodeDataUrl } from './lib/qrCode'
import {
  createSafePayOrder,
  createSafePayOrderRequestLink,
  createSafePayOrderRequestPayload,
  getSafePayOrderRequestFromUrl,
  type SafePayOrder,
  type SafePayOrderDraft,
  type SafePayOrderRequestPayload,
} from './lib/safePayOrder'
import {
  clearSafePayBusinessOrders,
  getSafePayBusinessOrders,
  getSafePayPaidRequest,
  getWalletPaidRequestId,
  saveSafePayBusinessOrder,
  saveSafePayPaidRequest,
  updateSafePayBusinessOrderStatus,
  shortValue,
  type SafePayBusinessOrderRecord,
} from './lib/safePayActivity'
import { findSafePayPaymentOnNimiqBlockchain } from './lib/nimiqBlockchainPayments'
import { demoPoseidonPublicValues } from './lib/intentHash'
import { LOCAL_HONK_VERIFIER_ADDRESS } from './config/localVerifier'
import { useNimiqProvider } from './hooks/useNimiqProvider'
import { useNimiqPayment } from './hooks/useNimiqPayment'
import { NimiqPayFlowShell } from './components/NimiqPayFlowShell'



const IS_GITHUB_PAGES =
  typeof window !== 'undefined' &&
  window.location.hostname === 'kmiru.github.io'

const LOCAL_UI_DEV_MODE = true //Cuando quieras probar Local EVM real cambia true to false y ejecuta anvil y el verifier localmente. Si quieres probar la UI sin anvil ni verifier, ponlo en true.
const SHOULD_RUN_LOCAL_EVM = !IS_GITHUB_PAGES && !LOCAL_UI_DEV_MODE
const SAFE_PAY_PAYMENT_NETWORK: 'testnet' | 'mainnet' =
  import.meta.env.VITE_NIMIQ_NETWORK === 'testnet' ? 'testnet' : 'mainnet'

function getFriendlyPaymentLinkError(link: string) {
  const trimmedLink = link.trim()
  const lowerLink = trimmedLink.toLowerCase()

  if (lowerLink.startsWith('nimiq:')) {
    return new Error(
      'Standard Nimiq QR detected. This is not a SafePay request. Use a real SafePay payment request QR.'
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


async function waitForDemoVerification(timeoutMs = 650): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs)
  })
}

async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: number | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  try {
    return await Promise.race([task, timeout])
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }
}

function App() {
  const paymentReviewRef = useRef<HTMLElement | null>(null)
  const paymentCardRef = useRef<HTMLDivElement | null>(null)
  const nimiqProvider = useNimiqProvider()

  const { scrollToElement } = useSmoothScroll()

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
  const [paidRequestTxHash, setPaidRequestTxHash] = useState<string | null>(null)
  const [businessOrders, setBusinessOrders] = useState<SafePayBusinessOrderRecord[]>(() =>
    getSafePayBusinessOrders(),
  )
  const [blockchainPaymentChecking, setBlockchainPaymentChecking] = useState(false)
  const [blockchainPaymentError, setBlockchainPaymentError] = useState<string | null>(null)
  const businessAutoSyncRunningRef = useRef(false)

  const {
    paymentStatus: nimiqPaymentStatus,
    resetPaymentStatus: resetNimiqPaymentStatus,
    sendPayment: sendNimiqPayment,
  } = useNimiqPayment()

  const {
    status,
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

  function getLocalPaidRecordForOrder(order: SafePayOrder | null) {
    if (!order || !nimiqProvider.account) return null

    return getSafePayPaidRequest({
      requestKey: order.id,
      payerAddress: nimiqProvider.account,
    })
  }

  function applyLocalPaidStatus(order: SafePayOrder): SafePayOrder {
    const paidRecord = getLocalPaidRecordForOrder(order)

    if (!paidRecord) {
      return order
    }

    return {
      ...order,
      status: 'paid',
    }
  }

  useEffect(() => {
    if (!activeSafePayOrder || !nimiqProvider.account) {
      setPaidRequestTxHash(null)
      return
    }

    const paidRecord = getLocalPaidRecordForOrder(activeSafePayOrder)

    setPaidRequestTxHash(paidRecord?.txHash ?? null)

    if (paidRecord && activeSafePayOrder.status !== 'paid') {
      setActiveSafePayOrder({
        ...activeSafePayOrder,
        status: 'paid',
      })
    }
  }, [activeSafePayOrder?.id, activeSafePayOrder?.status, nimiqProvider.account])

  useEffect(() => {
    try {
      const payload = getSafePayOrderRequestFromUrl()

      if (!payload) {
        return
      }

      console.log('Incoming SafePay order request:', payload)

      loadSafePayOrderRequestPayload(payload)
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
  function getUnixSecondsFromIso(value: string): number {
    const timestamp = Math.floor(new Date(value).getTime() / 1000)

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return Math.floor(Date.now() / 1000) + 15 * 60
    }

    return timestamp
  }

  function createPaymentReviewPayloadFromSafePayOrderRequest(
    safePayRequest: SafePayOrderRequestPayload,
  ): SafePayQrPayload {
    const network =
      safePayRequest.network === 'mainnet'
        ? 'nimiq-mainnet'
        : 'nimiq-testnet'

    return {
      app: 'nimiq-safepay-zk',
      version: 1,
      payload: {
        domainSeparator: 'SAFEPAY-ZK-V1',
        nimiqNetworkId:
          safePayRequest.network === 'mainnet'
            ? 'MainAlbatross'
            : 'TestAlbatross',
        evmVerifierChainId: 31337,
        version: 'safepay-zk-v1',
        type: 'nim-payment-intent',
        network,
        recipient: safePayRequest.recipient,
        amountNim: safePayRequest.order.totalNim,
        memoSecretHash:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        expiresAt: getUnixSecondsFromIso(safePayRequest.order.expiresAt),
        nonce:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        salt:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        secret:
          '0x0000000000000000000000000000000000000000000000000000000000000002',
      },
    }
  }

  function createPaymentReviewPayloadFromOrder(): SafePayQrPayload {
    if (!activeSafePayOrder) {
      throw new Error('No SafePay order loaded.')
    }

    if (!activeSafePayOrderRecipient) {
      throw new Error('This SafePay request is missing the payment recipient.')
    }

    return createPaymentReviewPayloadFromSafePayOrderRequest({
      version: 'safepay-order-v1',
      type: 'payment-request',
      recipient: activeSafePayOrderRecipient,
      network: activeSafePayOrderNetwork ?? SAFE_PAY_PAYMENT_NETWORK,
      order: activeSafePayOrder,
    })
  }

  function loadSafePayOrderRequestPayload(
    safePayRequest: SafePayOrderRequestPayload,
  ) {
    const orderWithLocalStatus = applyLocalPaidStatus(safePayRequest.order)
    const paidRecord = getLocalPaidRecordForOrder(safePayRequest.order)

    setActiveSafePayOrder(orderWithLocalStatus)
    setActiveSafePayOrderRecipient(safePayRequest.recipient)
    setActiveSafePayOrderNetwork(safePayRequest.network)
    setPaidRequestTxHash(paidRecord?.txHash ?? null)
    setIncomingSafePayRequestError(null)
  }

  function loadSafePayOrderForReceipt(
    safePayRequest: SafePayOrderRequestPayload,
  ) {
    loadSafePayOrderRequestPayload(safePayRequest)

    setCreatedRequestQr(null)
    setCreatedRequestLink(null)
    setCreatedRequestError(null)
    setBlockchainPaymentError(null)

    resetPaymentReview()
    resetVerificationState()
  }


  function loadSafePayOrderForReview() {
    try {
      if (activeSafePayOrder?.status === 'paid') {
        throw new Error('This wallet already paid this SafePay request.')
      }

      const parsed = createPaymentReviewPayloadFromOrder()

      resetVerificationState()
      handleParseSuccess(parsed)
      scrollToElement(paymentReviewRef)
    } catch (error) {
      console.error(error)

      handleParseError(error)
      scrollToElement(paymentReviewRef)
    }
  }

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
  }

  function clearCurrentBusinessRequest() {
    setCreatedRequestQr(null)
    setCreatedRequestLink(null)
    setCreatedRequestError(null)

    setActiveSafePayOrder(null)
    setActiveSafePayOrderRecipient(null)
    setActiveSafePayOrderNetwork(null)
    setPaidRequestTxHash(null)

    setBlockchainPaymentError(null)
    setIncomingSafePayRequestError(null)
  }


  function clearActiveSafePayRequest() {
    setActiveSafePayOrder(null)
    setActiveSafePayOrderRecipient(null)
    setActiveSafePayOrderNetwork(null)
    setPaidRequestTxHash(null)
    setIncomingSafePayRequestError(null)
  }


  function getOrderTimestampMs(value: string): number | null {
    const timestamp = new Date(value).getTime()

    return Number.isFinite(timestamp) ? timestamp : null
  }

  function getBusinessOrderLiveStatus(record: SafePayBusinessOrderRecord) {
    if (record.status !== 'active') {
      return record.status
    }

    const expiresAtMs = getOrderTimestampMs(record.expiresAt)

    if (expiresAtMs !== null && Date.now() > expiresAtMs) {
      return 'expired' as const
    }

    return record.status
  }

  function getBusinessOrdersWithLiveStatuses() {
    const orders = getSafePayBusinessOrders()
    let changed = false

    const liveOrders = orders.map((order) => {
      const liveStatus = getBusinessOrderLiveStatus(order)

      if (liveStatus === order.status) {
        return order
      }

      changed = true

      updateSafePayBusinessOrderStatus({
        orderId: order.id,
        status: liveStatus,
      })

      return {
        ...order,
        status: liveStatus,
      }
    })

    return changed ? getSafePayBusinessOrders() : liveOrders
  }

  function refreshBusinessOrders() {
    setBusinessOrders(getBusinessOrdersWithLiveStatuses())
  }

  function getIntentHashForPaymentCheck() {
    return status.publicInputs[0] ?? demoPoseidonPublicValues.intentHash
  }

  function updateActiveOrderStatus(params: {
    orderId: string
    status: SafePayOrder['status']
    txHash?: string
  }) {
    if (params.txHash) {
      setPaidRequestTxHash(params.txHash)
    }

    setActiveSafePayOrder((currentOrder) => {
      if (!currentOrder || currentOrder.id !== params.orderId) {
        return currentOrder
      }

      return {
        ...currentOrder,
        status: params.status,
      }
    })
  }

  async function syncBusinessOrderStatusFromBlockchain(
    record: SafePayBusinessOrderRecord,
  ) {
    if (record.status === 'paid' || record.status === 'cancelled') {
      return
    }

    const payload = getSafePayOrderRequestFromUrl(record.requestLink)

    if (!payload) {
      throw new Error('This saved order is missing a valid SafePay request link.')
    }

    const intentHash = getIntentHashForPaymentCheck()
    const requestCreatedAtMs = getOrderTimestampMs(record.createdAt)
    const requestExpiresAtMs = getOrderTimestampMs(record.expiresAt)

    if (requestCreatedAtMs === null) {
      throw new Error('This saved order is missing a valid creation date.')
    }

    if (requestExpiresAtMs === null) {
      throw new Error('This saved order is missing a valid expiration date.')
    }

    const foundPayment = await findSafePayPaymentOnNimiqBlockchain({
      network: payload.network,
      recipientAddress: payload.recipient,
      amountNim: payload.order.totalNim,
      intentHash,
      maxTransactions: 500,
      minTimestampMs: requestCreatedAtMs,
      maxTimestampMs: requestExpiresAtMs,
    })

    if (foundPayment) {
      const paidAt = new Date().toISOString()

      updateSafePayBusinessOrderStatus({
        orderId: payload.order.id,
        status: 'paid',
        txHash: foundPayment.txHash,
        paidAt,
      })

      if (foundPayment.senderAddress) {
        saveSafePayPaidRequest({
          id: getWalletPaidRequestId({
            requestKey: payload.order.id,
            payerAddress: foundPayment.senderAddress,
          }),
          requestKey: payload.order.id,
          payerAddress: foundPayment.senderAddress,
          recipientAddress: foundPayment.recipientAddress ?? payload.recipient,
          amountNim: payload.order.totalNim,
          network: payload.network,
          txHash: foundPayment.txHash,
          paidAt,
          orderNumber: payload.order.orderNumber,
          intentHashShort: shortValue(intentHash),
          txHashShort: shortValue(foundPayment.txHash),
        })
      }

      setPaidRequestTxHash(foundPayment.txHash)
      setActiveSafePayOrderNetwork(payload.network)
      updateActiveOrderStatus({
        orderId: payload.order.id,
        status: 'paid',
        txHash: foundPayment.txHash,
      })
      return
    }

    if (Date.now() > requestExpiresAtMs && record.status === 'active') {
      updateSafePayBusinessOrderStatus({
        orderId: payload.order.id,
        status: 'expired',
      })

      updateActiveOrderStatus({
        orderId: payload.order.id,
        status: 'expired',
      })
    }
  }

  async function syncBusinessOrdersAutomatically(showErrors = false) {
    if (businessAutoSyncRunningRef.current) {
      return
    }

    const orders = getBusinessOrdersWithLiveStatuses()
    const ordersToCheck = orders.filter((order) => order.status === 'active')

    setBusinessOrders(orders)

    if (ordersToCheck.length === 0) {
      return
    }

    try {
      businessAutoSyncRunningRef.current = true
      setBlockchainPaymentChecking(true)

      if (!showErrors) {
        setBlockchainPaymentError(null)
      }

      for (const order of ordersToCheck) {
        await syncBusinessOrderStatusFromBlockchain(order)
      }

      setBusinessOrders(getBusinessOrdersWithLiveStatuses())
    } catch (error) {
      console.error(error)

      if (showErrors) {
        setBlockchainPaymentError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      businessAutoSyncRunningRef.current = false
      setBlockchainPaymentChecking(false)
    }
  }

  async function checkBusinessOrderPaymentOnBlockchain(record: SafePayBusinessOrderRecord) {
    try {
      setBlockchainPaymentChecking(true)
      setBlockchainPaymentError(null)
      await syncBusinessOrderStatusFromBlockchain(record)
      setBusinessOrders(getBusinessOrdersWithLiveStatuses())
    } catch (error) {
      console.error(error)
      setBlockchainPaymentError(error instanceof Error ? error.message : String(error))
    } finally {
      setBlockchainPaymentChecking(false)
    }
  }

  async function openBusinessOrder(record: SafePayBusinessOrderRecord) {
    try {
      const payload = getSafePayOrderRequestFromUrl(record.requestLink)

      if (!payload) {
        throw new Error('This saved order is missing a valid SafePay request link.')
      }

      const requestQr = await createQrCodeDataUrl(record.requestLink)
      const orderWithSavedStatus: SafePayOrder = {
        ...payload.order,
        status: record.status,
      }

      setActiveSafePayOrder(orderWithSavedStatus)
      setActiveSafePayOrderRecipient(payload.recipient)
      setActiveSafePayOrderNetwork(payload.network)
      setCreatedRequestQr(requestQr)
      setCreatedRequestLink(record.requestLink)
      setCreatedRequestError(null)
      setPaidRequestTxHash(record.txHash ?? null)
      setIncomingSafePayRequestError(null)
    } catch (error) {
      console.error(error)
      setCreatedRequestError(error instanceof Error ? error.message : String(error))
    }
  }

  async function createSafePayRequest(orderDraft?: SafePayOrderDraft) {
    if (!orderDraft) {
      setCreatedRequestQr(null)
      setCreatedRequestLink(null)
      setCreatedRequestError('Create a real payment request from Business mode first.')
      return
    }

    if (!nimiqProvider.account) {
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
      setPaidRequestTxHash(null)

      const safePayOrder = createSafePayOrder(orderDraft)
      const payload = createSafePayOrderRequestPayload({
        order: safePayOrder,
        recipient: nimiqProvider.account,
        network: SAFE_PAY_PAYMENT_NETWORK,
      })

      const appBaseUrl =
        import.meta.env.VITE_SAFEPAY_APP_URL ||
        `${window.location.origin}${import.meta.env.BASE_URL}`

      const requestLink = createSafePayOrderRequestLink({
        payload,
        appBaseUrl,
      })

      console.log('SafePay active order:', safePayOrder)
      console.log('SafePay compact request link:', requestLink)

      const dataUrl = await createQrCodeDataUrl(requestLink)

      saveSafePayBusinessOrder({
        id: safePayOrder.id,
        orderNumber: safePayOrder.orderNumber,
        businessName: safePayOrder.businessName,
        totalNim: safePayOrder.totalNim,
        createdAt: safePayOrder.createdAt,
        expiresAt: safePayOrder.expiresAt,
        status: safePayOrder.status,
        recipientAddress: payload.recipient,
        network: payload.network,
        requestLink,
      })
      refreshBusinessOrders()

      setActiveSafePayOrder(safePayOrder)
      setActiveSafePayOrderRecipient(payload.recipient)
      setActiveSafePayOrderNetwork(payload.network)
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

      if (LOCAL_UI_DEV_MODE) {
        await waitForDemoVerification()
        console.warn(
          'SafePay demo verification used. Browser ZK proof generation is skipped in LOCAL_UI_DEV_MODE.',
        )
      } else {
        const zkVerified = await withTimeout(
          runPaymentIntentProof(),
          90_000,
          'SafePay verification took too long. Please try again.',
        )

        if (!zkVerified) {
          throw new Error(
            'The browser ZK proof could not be verified. Do not continue with this payment.'
          )
        }

        if (SHOULD_RUN_LOCAL_EVM) {
          const evmVerified = await withTimeout(
            verifyOnLocalEvm(),
            20_000,
            'Local EVM verification took too long. Make sure Anvil and the verifier contract are running.',
          )

          if (!evmVerified) {
            throw new Error(
              'The local EVM verifier rejected this payment request. Do not continue with this payment.'
            )
          }
        } else {
          console.warn(
            'Local EVM verifier skipped. Browser ZK proof verified.'
          )
        }
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

      const safePayOrderRequest = getSafePayOrderRequestFromUrl(pastedLink)

      if (safePayOrderRequest) {
        loadSafePayOrderForReceipt(safePayOrderRequest)
        return
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

      const linkToParse = scannedLink

      const safePayOrderRequest = getSafePayOrderRequestFromUrl(linkToParse)

      if (safePayOrderRequest) {
        setManualPaymentLink(linkToParse)
        loadSafePayOrderForReceipt(safePayOrderRequest)
        setScannerError(null)
        return
      }

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

  async function sendVerifiedNimiqPayment() {
    if (!paymentReview) {
      return
    }

    const intentHash = status.publicInputs[0] ?? demoPoseidonPublicValues.intentHash
    const requestKey = activeSafePayOrder?.id ?? null
    const payerAddress = nimiqProvider.account

    if (requestKey && payerAddress) {
      const paidRecord = getSafePayPaidRequest({
        requestKey,
        payerAddress,
      })

      if (paidRecord) {
        setPaidRequestTxHash(paidRecord.txHash)
        setActiveSafePayOrder((currentOrder) =>
          currentOrder
            ? {
              ...currentOrder,
              status: 'paid',
            }
            : currentOrder,
        )
        return
      }
    }

    const transactionHash = await sendNimiqPayment({
      paymentReview,
      intentHash,
      getProvider: nimiqProvider.getProvider,
    })

    if (!transactionHash || !requestKey || !payerAddress) {
      return
    }

    const paidAt = new Date().toISOString()

    saveSafePayPaidRequest({
      id: getWalletPaidRequestId({
        requestKey,
        payerAddress,
      }),
      requestKey,
      payerAddress,
      recipientAddress: paymentReview.recipient,
      amountNim: String(paymentReview.amountNim),
      network: paymentReview.network ?? activeSafePayOrderNetwork ?? 'Nimiq',
      txHash: transactionHash,
      paidAt,
      orderNumber: activeSafePayOrder?.orderNumber,
      intentHashShort: shortValue(intentHash),
      txHashShort: shortValue(transactionHash),
    })

    updateSafePayBusinessOrderStatus({
      orderId: requestKey,
      status: 'paid',
      txHash: transactionHash,
      paidAt,
    })
    setBusinessOrders(getSafePayBusinessOrders())

    setPaidRequestTxHash(transactionHash)
    setActiveSafePayOrder((currentOrder) =>
      currentOrder
        ? {
          ...currentOrder,
          status: 'paid',
        }
        : currentOrder,
    )
  }

  useEffect(() => {
    refreshBusinessOrders()
    void syncBusinessOrdersAutomatically(false)

    const timer = window.setInterval(() => {
      void syncBusinessOrdersAutomatically(false)
    }, 8000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const proofPublicInputs =
    status.publicInputs.length > 0
      ? status.publicInputs
      : [demoPoseidonPublicValues.intentHash, demoPoseidonPublicValues.nullifier]

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
      activeRequestPaid={activeSafePayOrder?.status === 'paid'}
      activeRequestPaidTxHash={paidRequestTxHash}
      businessOrders={businessOrders}
      blockchainPaymentChecking={blockchainPaymentChecking}
      blockchainPaymentError={blockchainPaymentError}
      incomingSafePayRequestError={incomingSafePayRequestError}
      paymentReview={paymentReview}
      reviewStatus={reviewStatus}
      reviewError={reviewError}
      proofPublicInputs={proofPublicInputs}
      nimiqConnected={nimiqProvider.connected}
      nimiqConnecting={nimiqProvider.connecting}
      nimiqAccount={nimiqProvider.account}
      paymentStatus={nimiqPaymentStatus}
      onManualPaymentLinkChange={(value) => {
        setManualPaymentLink(value)
        resetVerificationState()
      }}
      onParsePaymentLink={parseManualPaymentLink}
      onStartQrScanner={startQrScanner}
      onStopQrScanner={stopQrScanner}
      onVerifyBeforePayment={verifyBeforePayment}
      onSendPayment={sendVerifiedNimiqPayment}
      onConnectNimiq={nimiqProvider.connect}
      onDisconnectNimiq={nimiqProvider.disconnectLocalState}
      onResetFlow={resetFlow}
      onClearCurrentBusinessRequest={clearCurrentBusinessRequest}
      onClearActiveSafePayRequest={clearActiveSafePayRequest}
      onCreateRequest={createSafePayRequest}
      onLoadCreatedRequestForReview={loadSafePayOrderForReview}
      onRefreshBusinessOrders={refreshBusinessOrders}
      onOpenBusinessOrder={openBusinessOrder}
      onCheckBusinessOrderPayment={checkBusinessOrderPaymentOnBlockchain}
      onClearBusinessOrders={() => {
        clearSafePayBusinessOrders()
        setBusinessOrders([])
      }}
    />
  )
}
export default App
# Nimiq SafePay ZK — Nimiq Pay Mobile Checkpoint

Last updated: 2026-06-03

## Status

The app is now confirmed working inside Nimiq Pay on mobile.

## Confirmed working

- Local Vite app opens from phone using Windows Wi-Fi IP.
- WSL/Vite port forwarding works on port 5173.
- Anvil RPC is reachable from phone through Windows Wi-Fi IP on port 8545.
- Nimiq Pay injects the provider.
- `Connect Nimiq Pay` works.
- Provider status shows connected.
- Consensus is established.
- Block number is visible.
- Payment Review works.
- Browser ZK proof works.
- Local EVM verifier works from inside Nimiq Pay.
- `Verify Before Payment` works inside Nimiq Pay.
- Final status shows `Private Intent Verified`.

## Important networking notes

The phone needs access to two local services:

```txt
Frontend:
http://WINDOWS_WIFI_IP:5173

Anvil RPC:
http://WINDOWS_WIFI_IP:8545

## TypeScript SDK response handling

The Nimiq Mini App SDK can return either successful values or `ErrorResponse` objects for provider calls.

The app now guards provider responses before using them:

```txt
listAccounts() -> string[] | ErrorResponse
isConsensusEstablished() -> boolean | ErrorResponse
getBlockNumber() -> number | ErrorResponse
sendBasicTransaction() -> string | ErrorResponse

Fixed files:

app/src/hooks/useNimiqProvider.ts
app/src/hooks/useNimiqPayment.ts

This allows:

npm run build

to pass successfully.

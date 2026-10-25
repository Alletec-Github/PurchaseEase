<p align="center"><img src="docs/community-logo.svg" width="96" alt="PurchaseEase community logo" /></p>

# PurchaseEase

Mobile purchase order management app with demo data mode.

PurchaseEase helps purchasing teams create, manage and track orders. It runs in Expo Go SDK 54 with local sample data; there is no Business Central or Azure connection.

## Features

- Persistent demo sign-in and profile, five-tab navigation
- Dashboard metrics, recent orders, pull-to-refresh and quick actions
- Vendor and item search, four-step order creation with dates, quantities, discounts and notes
- Draft submission, order and line editing, deletion, receive and invoice
- Posted invoices with search, date filters and read-only details
- Simulated document extraction with a prefilled order; no camera access or document upload
- Resettable in-memory demo data and reusable accessible card components

## Stack and architecture

Expo SDK 54 / React Native 0.81 / React 19.1, TypeScript, React Navigation 7 native stacks and bottom tabs, Expo MaterialCommunityIcons, AsyncStorage, native date picker, Gesture Handler and Reanimated. Axios is available for a future API adapter but demo services make no HTTP requests. The project `.npmrc` keeps npm peer resolution consistent with the explicitly pinned Expo platform dependencies.

`src/screens` contains screens, `src/navigation` owns routes, `src/components` holds shared UI, `src/types` defines BC-shaped entities and app types, `src/config` stores theme and local configuration. Screens depend on the `bcApi` service interface; `src/services/mockData.ts` owns seeds and `bcApi.ts` implements session mutations with 300–600ms latency.

## Local development

Use Node.js 20.19.4+ and npm. An Expo Go build compatible with SDK 54 is required. A global React Native CLI is unnecessary for Expo Go.

```sh
git clone https://github.com/Alletec-Github/PurchaseEase.git
cd PurchaseEase
npm install
cp src/config/appConfig.example.ts src/config/appConfig.ts
# Set demoUsername, demoPassword and environment in the copied file.
npm start
```

Scan Metro's QR code in compatible Expo Go on a phone on the same network. Use `npx expo start --tunnel` if LAN discovery is unavailable. The local config is gitignored; never commit credentials. Demo credentials provide a local UI gate, not production authentication.

```sh
npm run ios       # Expo Go in Device Hub (Xcode 27+) or Simulator (older Xcode)
npm run android   # Expo Go in a running Android emulator
npm run web       # Browser preview
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform ios --platform android
```

For iOS Simulator install full Xcode, its iOS runtime and select Xcode as the active developer directory. The iOS launcher detects Apple’s [Device Hub](https://developer.apple.com/documentation/xcode/device-hub) in Xcode 27 or the legacy Simulator app, selects an available iPhone, installs the Expo Go client matching SDK 54, and opens this project. It reuses Metro on port 8081 or starts it if needed; set `EXPO_PORT` to use another port. Command Line Tools alone cannot launch simulators. Android needs Android Studio, SDK and an emulator or a USB-debugging device.

This is an Expo managed project. Pods are unnecessary for Expo Go. For native builds, install Xcode and CocoaPods (iOS) or JDK 17 and Android Studio (Android), then run `npx expo prebuild`, `npx pod-install`, and `npx expo run:ios` / `npx expo run:android`. Generated `ios` and `android` directories are ignored to prevent stale native dependencies from drifting from SDK 54.

## Demo Mode Guide

Edit arrays in `src/services/mockData.ts` to change vendors, items, purchase orders, order lines, posted invoices, units and locations. Keep IDs and vendor/item references consistent. Seeds contain at least 10 orders with 2–4 lines each, eight vendors, 15 items, five invoices, five units and three warehouses. Order dates are relative to the current month for useful dashboard data.

Service reads return copies; changes persist only for the running app session. Reloading the JS runtime or selecting Settings → Clear cached data restores the seeds. Signing out preserves demo session data until reset. Login state alone persists with AsyncStorage. No device or business data leaves the app.

`bcApi.ts` exposes named functions and `bcApi`, uses typed `MockApiError` errors, and supports OData-style `$filter`, `$orderby`, `$top`, `$skip` (plus `filter`, `orderby`, `top` aliases). Supported filters: comparisons and `contains`, `startswith`, `endswith`, joined by `and` / `or`. Unsupported expressions reject with a typed 400 error. Call `simulateNextError()` to exercise a single failure deterministically. Failed validation never changes state. Receiving an open order marks it received and creates one posted invoice; repeat receipt is rejected.

For a future Business Central integration, replace the exported service implementation with an adapter that preserves the same signatures. Put OAuth credentials and privileged receive/post operations on a secure backend; do not ship client secrets in the mobile bundle. Map BC receipt state (`fullyReceived`) into the app's Received display status. Add server pagination, concurrency, authorization and integration tests before enabling a real connection.

## Azure Document Intelligence (Future)

The scan screen is a simulation and does not analyze files. A future backend can accept a camera image or PDF, call Azure Document Intelligence, and return extracted fields for user review. Provision an Azure resource and train a custom extraction model in Document Intelligence Studio with labeled vendor name, invoice number/date, line items, quantities, unit costs, discounts, tax and totals. Keep endpoint credentials on the backend; review low-confidence values and resolve vendors/items against master data before creating orders.

## Screenshots

| Login | Dashboard | Create order | Order detail |
|---|---|---|---|
| [iOS login](docs/screenshots/login-ios.png) | Pending device capture | Pending device capture | Pending device capture |

| Orders | Invoices | Scan demo | Settings |
|---|---|---|---|
| Pending device capture | Pending device capture | Pending device capture | Pending device capture |

## Backlog and delivery

See [demo backlog](docs/backlog.md). The repository already contained the original 12 merged feature PRs; this demo migration is tracked separately with one issue and sequential PR per workstream.

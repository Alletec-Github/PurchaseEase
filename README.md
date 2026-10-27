<p align="center"><img src="docs/community-logo.svg" width="96" alt="PurchaseEase community logo" /></p>

# PurchaseEase

Mobile purchase order management app integrated with Business Central.

PurchaseEase helps purchasing teams create, manage and track purchase orders through Microsoft's standard Business Central v2.0 APIs. It runs in Expo Go SDK 54 with live data. Document extraction remains an explicitly labeled simulation.

## Features

- Persistent demo login and profile; five tabs with typed stack navigation
- Live dashboard metrics, totals grouped by currency, recent orders and quick actions
- Searchable vendors and items; four-step purchase order wizard with dates, quantities, costs and discounts
- Order search, Draft/Open/Received filters, details, header and line editing, deletion, receive and invoice
- Invoice search, date range filters and read-only details
- Simulated document extraction with catalog matching and manual review
- Settings connection test, token-cache clearing, logout and reusable accessible components
- Corporate blue theme, loading/error/retry/empty states and pull-to-refresh

## Stack and architecture

Expo SDK 54, React Native 0.81, React 19.1, TypeScript, React Navigation 7 native stacks/bottom tabs, Axios, AsyncStorage, native date picker, Expo MaterialCommunityIcons, Gesture Handler and Reanimated. Use the Expo-compatible versions in the lockfile. React Navigation follows the explicit project specification.

Screens call `src/services/bcApi.ts`. This centralized adapter provides every requested standard endpoint, OAuth client credentials with in-memory single-flight token caching, expiry/401 refresh, server pagination, OData options, typed errors and ETag concurrency. The `createBcApi` factory allows deterministic HTTP adapter tests without accessing a real tenant. `mockApi.ts` and `mockData.ts` are offline test fixtures and are not selected by the app. Authentication persistence stores only the demo profile and login flag, never the OAuth token.

`src/screens` contains screens; `src/navigation` owns routes; `src/components` holds shared UI; `src/types` defines API, app and route schemas; `src/config` holds theme and gitignored local configuration.

## Local development

Use Node.js 20.19.4+ and npm. Install an Expo Go build compatible with SDK 54. A global React Native CLI is unnecessary for Expo Go.

```sh
git clone https://github.com/Alletec-Github/PurchaseEase.git
cd PurchaseEase
npm install
cp src/config/appConfig.example.ts src/config/appConfig.ts
# Fill in the five BC credentials/environment/company values.
# Demo login defaults are literally [USERNAME] / [PASSWORD].
npm start
```

All deployment-specific values are in `src/config/appConfig.ts`, which is gitignored. The example contains placeholders only. `localCurrencyCode` can optionally be set to the company's ISO currency; otherwise blank BC currency codes are labeled LCY rather than assuming USD or EUR. The client secret is used for the requested direct-auth development prototype. A mobile bundle cannot keep a client secret confidential: move client credentials and privileged operations to a secured backend before distributing this app. Demo login is a local UI gate, not authorization for individual BC users. Rotate development secrets when moving to production.

```sh
npm run ios       # Expo Go SDK 54 in iOS Simulator or Xcode Device Hub
npm run android   # Expo Go in an Android emulator
npm run web       # Browser preview; native iOS/Android are the live integration targets
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform ios --platform android
```

For iOS install full Xcode, an iOS runtime, and select Xcode as the active developer directory. The iOS launcher supports Xcode Device Hub and Simulator, installs a matching Expo Go client and opens Metro. For Android install Android Studio, an SDK/emulator, or connect a USB-debugging device. Use the same network as Metro for a physical device.

Expo Go needs no CocoaPods installation or checked-in native project. For a native development build, install CocoaPods/Xcode for iOS or JDK 17/Android Studio for Android, then run `npx expo prebuild`, `npx pod-install`, and `npx expo run:ios` / `npx expo run:android`. The requested bare `react-native run-ios` workflow is replaced by Expo's supported launch workflow. Generated native folders are gitignored.

## Business Central setup guide

1. In the Microsoft Entra admin center register an app for your tenant. Record its application/client ID and directory/tenant ID.
2. Under Certificates & secrets, create a client secret and copy its **value** into the local config.
3. Add **Dynamics 365 Business Central → Application permissions → API.ReadWrite.All** and grant tenant admin consent. Automation permissions are unnecessary for the endpoints used here.
4. In Business Central open **Microsoft Entra Applications**, add the client ID, enable it, and assign permission sets sufficient to read vendors/items and manage purchase documents in the chosen company. Use least privilege; applications cannot receive SUPER.
5. Select the environment and company GUID. SaaS standard APIs are available without publishing custom web services. For on-premises environments enable API/OData services and configure Entra authentication according to Microsoft's guide; the supplied host targets SaaS.
6. Verify access to the standard entity sets **purchaseOrders**, **purchaseOrderLines**, **vendors**, **items**, **purchaseInvoices**, **unitsOfMeasure**, and **locations**. Standard API pages ship with BC; no custom API pages are required.
7. Open Settings to test the connection. A 401 usually indicates credentials/consent; a 403 indicates permissions; a 404 can indicate environment/company configuration.

Sources: [Microsoft service-to-service setup](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/automation-apis-using-s2s-authentication), [enabling APIs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/enabling-apis-for-dynamics-nav).

### Standard API contract and behavior

```text
Base:  https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/v2.0/companies({companyId})
Token: https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Scope: https://api.businesscentral.dynamics.com/.default
```

The adapter exposes the requested order/header/line CRUD methods, `receiveAndInvoice`, vendors, items, invoices, units and locations, plus a single-invoice read and connection/cache utilities. List methods accept `$filter`, `$orderby`, `$top`, `$expand`, `$select`, `$skip`, `$count` and legacy query aliases. Pagination follows only links inside the configured company endpoint. Updates/deletes use a supplied ETag or fetch the record's current ETag; conflicts require refresh. Mutations are never automatically retried on timeouts or server failures.

There are three relevant differences between the requested UI and Microsoft's standard API:

- **Status is read-only.** PATCH cannot release a purchase order. The Submit action explains this and opens the BC purchase-order list so the user can release the order, then return and refresh. There is no custom release API in this app. See [Microsoft's API page source](https://github.com/microsoft/ALAppExtensions/blob/main/Apps/W1/APIV2/app/src/pages/APIV2PurchaseOrders.Page.al).
- **Notes are comment lines.** The standard header has no `notes` property. Text is split into comment lines of up to 100 characters. Review shows an estimate excluding tax; BC calculates final tax and totals after saving.
- **Received is a UI state derived from `fullyReceived`.** The API status values remain Draft/In Review/Open. Receiving and invoicing may remove the order, so the app returns to the list and directs the user to Invoices rather than fetching a deleted order. Posting may require additional vendor invoice/setup data in BC; server errors are displayed rather than inventing invoice numbers.

Order creation saves the header then its lines sequentially. If a line fails, the partial order remains visible for review and adding missing lines in Edit; it is never silently deleted. If a header request times out, check Orders before retrying because BC may have accepted it. Editing additions/deletions apply immediately, as indicated in the UI. Multi-record edits are not atomic.

## Azure Document Intelligence (Future)

The scan screen simulates extraction; it does not open a camera or upload files. A future backend can accept an image/PDF, call Azure Document Intelligence and return fields for review. Provision an ADI resource and train a custom extraction model in Document Intelligence Studio with labeled vendor name, invoice number/date, line items, quantities, unit costs, discounts, tax and totals. Keep ADI credentials on the backend. Review confidence and resolve vendor/item IDs against BC before creating an order. The current placeholder matches sample names against the live catalog; unmatched records must be selected manually.

## Screenshots

| Login | Dashboard | Create order | Order detail |
|---|---|---|---|
| [iOS login](docs/screenshots/login-ios.png) | Pending device capture | Pending device capture | Pending device capture |

| Orders | Invoices | Scan placeholder | Settings |
|---|---|---|---|
| Pending device capture | Pending device capture | Pending device capture | Pending device capture |

## Delivery and validation

The repository already contained the original 12 merged feature PRs (#14–#25) and a later demo-only migration. The live integration restoration is tracked by [issue #51](https://github.com/Alletec-Github/PurchaseEase/issues/51), preserving this history. Copilot assignment was attempted but GitHub reports the coding agent is not enabled in this repository. See [backlog](docs/backlog.md) and [validation](docs/validation.md).

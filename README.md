<p align="center">
  <img src="https://alletec.com/wp-content/uploads/2023/03/alletec-logo.png" alt="Alletec Logo" width="200" />
</p>

<h1 align="center">PurchaseEase</h1>

<p align="center">
  <strong>Mobile purchase order management app integrated with Business Central</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.80+-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Business%20Central-v2.0%20API-0078D4" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green" />
</p>

---

## Overview

PurchaseEase is a React Native mobile application used by purchase departments to create, manage, and track purchase orders in **Microsoft Dynamics 365 Business Central**. Users can create purchase orders manually by selecting vendors and items, or from a scanned document (future Azure Document Intelligence integration).

The app uses **BC standard v2.0 APIs** — no custom APIs are required.

---

## Features

- **Dashboard** — Overview of open orders, monthly totals, pending receipts, and quick actions
- **Create Purchase Orders** — Step-by-step wizard: select vendor → add line items → set dates → review & submit
- **Order Management** — List, filter, search, edit, and delete purchase orders with real-time BC sync
- **Receive & Invoice** — One-tap receive and invoice posted purchase orders
- **Document Scanning** *(Coming Soon)* — AI-powered document extraction via Azure Document Intelligence
- **Posted Invoices** — View and search posted/invoiced purchase documents
- **Vendor & Item Lookup** — Searchable vendor and item catalogs from BC master data
- **Offline-ready Auth** — Demo login with AsyncStorage persistence
- **Professional UI** — Corporate blue design with status badges, card layouts, and pull-to-refresh

---

## Screenshots

> Screenshots will be added after the initial build is complete.

| Login | Dashboard | Create Order | Order Detail |
|-------|-----------|-------------|---------------|
| *Coming Soon* | *Coming Soon* | *Coming Soon* | *Coming Soon* |

| Orders List | Invoices | Document Scan | Settings |
|-------------|----------|---------------|----------|
| *Coming Soon* | *Coming Soon* | *Coming Soon* | *Coming Soon* |

---

## Tech Stack & Architecture

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.80+ with TypeScript |
| **Navigation** | React Navigation 7 (Bottom Tabs + Native Stack) |
| **HTTP Client** | Axios |
| **Storage** | @react-native-async-storage/async-storage |
| **Date Picker** | @react-native-community/datetimepicker |
| **Icons** | react-native-vector-icons (MaterialCommunityIcons) |
| **Animations** | react-native-gesture-handler + react-native-reanimated |
| **Backend** | Microsoft Dynamics 365 Business Central v2.0 API |
| **Auth** | OAuth2 Client Credentials (Entra ID / Azure AD) |

### Architecture

```
src/
├── components/          # Reusable UI components
│   ├── VendorCard.tsx
│   ├── ItemCard.tsx
│   ├── OrderCard.tsx
│   ├── InvoiceCard.tsx
│   ├── StatusBadge.tsx
│   ├── FormInput.tsx
│   ├── SearchableList.tsx
│   ├── QuantityInput.tsx
│   ├── CurrencyDisplay.tsx
│   ├── EmptyState.tsx
│   ├── LoadingOverlay.tsx
│   ├── SectionHeader.tsx
│   └── ActionButton.tsx
├── config/
│   ├── appConfig.ts       # Real config (gitignored)
│   ├── appConfig.example.ts # Placeholder config
│   └── theme.ts           # Theme constants
├── navigation/
│   └── AppNavigator.tsx   # Tab + Stack navigators
├── screens/
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── CreateOrderScreen.tsx
│   ├── OrderListScreen.tsx
│   ├── OrderDetailScreen.tsx
│   ├── EditOrderScreen.tsx
│   ├── ScanDocumentScreen.tsx
│   ├── PostedInvoicesScreen.tsx
│   └── SettingsScreen.tsx
├── services/
│   └── bcApi.ts           # Centralized BC API service
└── types/
    ├── api.ts             # BC API response types
    ├── navigation.ts      # Route param types
    └── app.ts             # App-specific types
```

---

## Business Central Setup Guide

### 1. Register an Entra ID (Azure AD) Application

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `PurchaseEase Mobile App`
3. Supported account types: **Single tenant**
4. Click **Register**
5. Note the **Application (client) ID** and **Directory (tenant) ID**
6. Go to **Certificates & secrets** → **New client secret** → Copy the secret value

### 2. Configure API Permissions

1. In your app registration, go to **API permissions** → **Add a permission**
2. Select **Dynamics 365 Business Central**
3. Choose **Application permissions**
4. Add: **API.ReadWrite.All**
5. Click **Grant admin consent** for your organization

### 3. Enable Standard BC APIs (v2.0)

Business Central standard v2.0 APIs should be enabled by default. Confirm these entities have API pages enabled:

| Entity | API Endpoint | Purpose |
|--------|-------------|----------|
| **Purchase Orders** | `/purchaseOrders` | Create, read, update, delete purchase orders |
| **Purchase Order Lines** | `/purchaseOrders({id})/purchaseOrderLines` | Manage order line items |
| **Vendors** | `/vendors` | Vendor master data lookup |
| **Items** | `/items` | Item master data lookup |
| **Purchase Invoices** | `/purchaseInvoices` | Posted/invoiced purchase documents |
| **Units of Measure** | `/unitsOfMeasure` | UoM reference data |
| **Locations** | `/locations` | Warehouse locations |

### 4. API Base URL Format

```
https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/v2.0/companies({companyId})
```

### 5. OAuth2 Token Endpoint

```
https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
```

With scope: `https://api.businesscentral.dynamics.com/.default`

---

## Azure Document Intelligence (Future)

> This feature is planned for a future release.

### Overview

Azure Document Intelligence (formerly Form Recognizer) will be integrated to enable **purchase invoice scanning**. Users will be able to:

1. **Capture or upload** a purchase invoice document (photo or PDF)
2. **Extract structured data** using a custom-trained ADI model:
   - Vendor name and address
   - Invoice number and date
   - Line items (description, quantity, unit cost, amount)
   - Tax amounts and totals
3. **Auto-populate** a new purchase order with the extracted data

### Custom Model Training

To set up ADI for your organization:

1. Create an **Azure AI Document Intelligence** resource in the Azure Portal
2. Use **Document Intelligence Studio** to label training documents
3. Train a **custom extraction model** with these fields:
   - `vendorName` — Vendor/supplier name
   - `invoiceNumber` — Invoice/document number
   - `invoiceDate` — Invoice date
   - `lineItems` (table) — Description, Quantity, UnitCost, Amount
   - `subtotal` — Pre-tax total
   - `taxAmount` — Tax amount
   - `totalAmount` — Total including tax
4. Deploy the model and note the **endpoint** and **API key**
5. Configure the model ID in `appConfig.ts`

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **React Native CLI**: `npm install -g @react-native-community/cli`
- **Xcode** 15+ (for iOS development)
- **CocoaPods**: `sudo gem install cocoapods`
- **Android Studio** with Android SDK (for Android development)
- **Watchman**: `brew install watchman`

### Installation

```bash
# Clone the repository
git clone https://github.com/Alletec-Github/PurchaseEase.git
cd PurchaseEase

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Copy config and fill in your credentials
cp src/config/appConfig.example.ts src/config/appConfig.ts
# Edit src/config/appConfig.ts with your Entra ID and BC values
```

### Configuration

Copy `src/config/appConfig.example.ts` to `src/config/appConfig.ts` and fill in:

```typescript
export const appConfig = {
  // Entra ID (Azure AD) OAuth2
  clientId: 'YOUR_CLIENT_ID',
  tenantId: 'YOUR_TENANT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',

  // Business Central
  bcEnvironment: 'YOUR_ENVIRONMENT',  // e.g., 'Production'
  bcCompanyId: 'YOUR_COMPANY_ID',

  // Demo Login
  demoUsername: 'rishabh.shukla',
  demoPassword: '1234',

  // App
  appName: 'PurchaseEase',
  primaryColor: '#0078D4',
};
```

> **Important:** `appConfig.ts` is gitignored and must not be committed.

### Running the App

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Start Metro bundler (if not auto-started)
npx react-native start
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m 'Add your feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## License

Proprietary — © 2026 Alletec. All rights reserved.

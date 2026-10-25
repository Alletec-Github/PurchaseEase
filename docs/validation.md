# Validation and bug fixes

The previous implementation depended on live Business Central credentials and React Native 0.85 native projects. It has been migrated to Expo Go SDK 54 / React Native 0.81 with a local demo adapter.

## Fixed behavior

- Sign-in updates React state directly; production builds no longer depend on DevSettings.reload.
- Sign-out removes the same AsyncStorage keys written by sign-in. Session restoration handles malformed storage.
- Settings resets actual mock state rather than unrelated cache keys; profile and environment use configured values.
- Received orders cannot be edited, deleted or received twice. Receipt records quantities and creates a single posted invoice.
- Line mutations update discounts, tax and order totals. Invalid values and unknown catalog references reject before mutation.
- Create wizard validates quantity, cost, discounts and receipt dates, persists notes, cleans up partial drafts on failure and can navigate to details from every entry point.
- Dashboard counts all orders and uses local calendar month boundaries.
- Scan simulation uses actual vendor and item IDs; revisiting an existing creation screen applies fresh prefill data.
- Invoice detail uses quoted string filters, existing schema fields, and derived tax amounts. Invoice lists sort by posting date and expose validated date filters and retry states.
- Expo-bundled icons and safe-area insets replace native linking assumptions and fixed bottom tab heights.
- Metro, Babel, Jest and TypeScript use Expo SDK 54 configuration. Stale native directories are replaced by generated Expo projects when a native build is needed.

## Automated checks

Final local checks passed: TypeScript, lint with zero warnings, 14 tests across three suites, all 18 Expo Doctor checks, Expo dependency alignment, and iOS / Android / web production bundle export. These checks validate JavaScript and service behavior; they do not constitute device UI testing.

Service and auth regression tests cover seed completeness, order and line CRUD, totals, receipt and invoice creation, read-only protections, invalid inputs, copy isolation, reset, injected errors, OData-style filtering/sorting/pagination, simulated latency, login persistence and logout.

CI copies the placeholder config before validation. Actual local demo credentials remain gitignored. Native compilation, device interaction and simulator screenshots require the platform toolchains and are separate from JavaScript bundle validation.

## Environment limitations

- GitHub Actions run 40150392604 could not start any validation steps. Its annotation states: `The job was not started because your account is locked due to a billing issue.` The workflow is committed for use once the account issue is resolved; all reported validation results above were executed locally.
- `CI=1 npm run ios -- --port 8081` was attempted and stopped with Expo requiring a full Xcode installation.

- Copilot issue assignment was attempted. GitHub responded: `Copilot agent is not enabled in this repository.` The issues were implemented directly through sequential linked feature PRs.
- The initial host lacked Xcode. This was resolved by installing Xcode 27.1, selecting its developer directory and completing first-launch setup. PurchaseEase was subsequently launched in Expo Go SDK 54 on an iPhone 17 Pro with iOS 26.3, and its login screen was visually verified. See `docs/screenshots/login-ios.png`. Native app compilation remains separate from this Expo Go check.

## Dependency audit

`npm audit` reports 15 dependency advisories (6 high, 9 moderate) in the SDK 54 dependency tree. A nonbreaking `npm audit fix` was attempted and did not clear them. The direct advisory sources include image-size, node-forge, postcss and uuid; affected parent packages inherit those findings. npm proposes incompatible SDK changes for several paths. No forced SDK downgrade or untested major override was applied. Review these before adding document uploads or a production backend; keep this build in its requested local demo mode.

## Xcode 27 launcher fix

Xcode 27 replaces Simulator.app with Device Hub. `npm run ios` now runs `scripts/ios.mjs`, which detects either viewer, boots an available iPhone, installs the SDK-matched Expo Go client and opens the Metro URL. The launcher was exercised successfully on the installed iPhone 17 Pro simulator. On a first launch, accept the iOS Open in Expo Go confirmation if it appears.

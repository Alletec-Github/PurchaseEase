# Live integration validation — 27 October 2026

The existing Expo SDK 54 UI has been reconnected to standard Business Central v2.0 APIs in issue #51. The original feature PRs (#14–#25), later demo migration (#38–#49), and Xcode launcher fix (#50) are preserved.

## Verified locally

- TypeScript check and ESLint with zero warnings.
- 25 tests across four suites: live HTTP adapter contracts, offline mock fixture regression, login persistence/logout, and decimal inputs.
- All 18 Expo Doctor checks; Expo dependency versions aligned.
- Production JavaScript/Hermes exports for iOS and Android.
- Live adapter read-only smoke checks: vendors, items, purchase order list/header/lines, purchase invoice list/detail, units of measure, locations, connection test and cache reset.
- Actual BC unblocked-vendor enum `_x0020_` handled without hiding eligible vendors.
- Expo Go SDK 54 launched on iPhone 17 Pro / iOS 26.3. Login screen visually checked; see screenshots/login-ios.png.
- The iOS launcher detected Metro belonging to another checkout on port 8081 and selected port 8082. The served manifest confirms this workspace is the project root. Other projects' Metro processes were left running.
- Local credentials file remains gitignored. No credentials or business records were added to source, issues or screenshots.

The HTTP adapter tests exercise token encoding/caching/concurrent acquisition, expiry and bounded 401 refresh; OData options and multiple pages; rejecting foreign-company and path-traversal pagination links; ETag PATCH/DELETE; line/header/action URLs and bodies; typed errors without HTTP config/secret leakage; and no automatic retries of ambiguous failed writes.

## Deliberate verification limits

No live orders were created, edited, deleted, received or invoiced during verification. Write contracts are covered by a mocked Axios transport, not live posting. Authenticated screen interaction and end-to-end live purchasing remain manual acceptance checks. The native UI was launched through Expo Go; no native Xcode compilation or CocoaPods project is required for that workflow.

The standard API marks purchase-order status read-only, so release is handled in the BC web client. Notes are standard Comment lines. Tax comes from BC after save. Partial orders remain available for review rather than automatic deletion/retry; multi-record edits are not atomic. Local-currency amounts are labeled LCY unless the company currency is configured, and the dashboard never sums different currencies together.

## GitHub and dependency status

Copilot assignment to #51 was attempted and rejected: `Copilot agent is not enabled in this repository.` The work was implemented directly. The existing repository's earlier validation records reported a GitHub Actions account billing lock; new CI results must be inspected independently and not substituted for the successful local checks above.

The existing SDK 54 dependency tree reports 15 npm audit advisories (6 high, 9 moderate). No forced SDK change or untested major dependency override was applied. Direct client credentials satisfy the requested local prototype configuration but must move to a secured backend before distributing mobile builds.

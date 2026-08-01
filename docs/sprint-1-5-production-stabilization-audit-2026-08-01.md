# Sprint 1.5 production stabilization audit

**Audit date:** 2026-08-01  
**Scope:** Sprint 1 Tasks 1 to 3, plus the complete customer journey requested for authentication, Investigations, payments, reports, navigation, and responsive UX.  
**Decision:** **NO-GO for production. NO-GO for a payment-enabled external beta.**  
**Change policy:** No application code was changed. This document is the only deliverable.

## Executive result

The three Sprint 1 foundations are present and their focused automated tests pass:

- Investigation access is expressed as a tenant-aware contract and covered for owners, organization members, staff, and cross-tenant denial.
- Logout calls the server, revokes the Supabase session when possible, clears the HTTP-only cookie, clears browser state, and protects refresh and Back navigation.
- Canonical Investigation list, detail, and creation use the Supabase repository with the authenticated actor. Seeded customer fallback is absent from the production path.

These results close the original shared-memory Investigation and stale logout blockers at the contract and repository-test level. They do not establish production readiness. The payment flow still depends on the customer's browser return, performs report generation in the confirmation request, and lacks a provider-event ledger. The requested live journey could not be executed because this checkout contains no deployment URL, test accounts, Supabase credentials, email inbox, PayPal sandbox identity token, or multi-tenant fixtures. Production behavior for email delivery, row-level security, payment settlement, browser compatibility, and device layout is therefore unverified.

One automated journey check currently fails. The Admin Archive contract expects administrator-comped reports to remain visible, but the canonical Archive client no longer contains that access-state behavior. This is a release regression until the intended contract is reconciled and tested through the canonical projection.

## Audit method and evidence

The audit used four evidence levels:

1. **Production build and static validation.** The Next.js production build completed for 78 pages. TypeScript completed. Production validation and lint completed with nine warnings.
2. **Automated journey tests.** Sprint 1 contract, logout, canonical persistence, payment/report unlock, administrator access, beta readiness, and the core suite were run.
3. **Repository trace.** The authenticated page and API paths were followed through proxy, session, Investigation repository, Archive projection, report access, checkout, PayPal completion, and report generation code.
4. **Live certification check.** Environment and deployment prerequisites were checked. No `.env` files or live test credentials are present, so a real signup email, Supabase session, tenant boundary, PayPal settlement, mobile browser, or desktop browser session could not be certified.

Passing source-pattern or mock tests are reported as contract validation. They are not described as production end-to-end proof.

## Journey scorecard

| Area | Result | Evidence and remaining limit |
| --- | --- | --- |
| Signup | Partial | Client validation and Supabase signup path exist. Verification-enabled signup returns no access token and is surfaced as an exception. No live email was received. |
| Email verification | Unverified | A redirect URL is sent to Supabase. No callback-specific session exchange or live inbox test was available. |
| Login | Partial | Password login establishes browser and server session state in code. No live Supabase account was available. |
| Logout | Contract pass | Four focused tests pass, including refresh, Back navigation, expiry, cookie absence, and protected API denial. No deployed multi-browser test was available. |
| Session restore | Partial | Session storage restores an unexpired access token. There is no automatic refresh path when the token expires. |
| Session expiration | Contract pass, UX partial | Proxy validates the token and redirects. Client storage removes an expired token. No live clock or refresh-token rotation test was available. |
| Create Investigation | Contract pass | Canonical Supabase insert is tested with authenticated ownership and tenant scope. Live database behavior is unverified. |
| Investigation list and details | Contract pass | Canonical projections are used and cross-tenant denial is tested. Live RLS behavior is unverified. |
| Archive | Fail | Canonical Archive lists only ready Investigations. Archive lifecycle mutation is not connected, and the Admin Archive check fails. |
| Ownership and organization membership | Contract pass | Owner, active member, approved staff, and cross-tenant cases pass repository and migration assertions. Live RLS policies are unverified. |
| Locked report | Contract pass | Browser state cannot unlock a report and locked routing is covered by tests. |
| Checkout | Contract pass | One report-scoped intent and active-intent reuse are covered. There is no live PayPal order execution. |
| PayPal and return | Production blocker | Server PDT verification exists. Completion still requires a browser return and has no webhook recovery. |
| Pending and paid report | Contract pass | Pending, processing, ready, failure, refresh, and direct URL routing are tested. Live settlement and generation are unverified. |
| Duplicate payment protection | Partial | Local duplicate initiation and repeated callback guards pass. There is no immutable provider transaction or event uniqueness boundary. |
| Executive Report | Contract pass, content unverified | The eight-section report contract validates. No newly purchased production report was generated and reviewed. |
| Report ownership | Partial | User-scoped requests and report guards exist. Live cross-tenant report URL access is unverified. |
| Admin access | Fail | Four of five admin access tests pass. Archive-compatible visibility fails. |
| Navigation | Partial | Safe legacy redirects and canonical purchase entry pass tests. The build still exposes multiple customer product families and shells. |
| Loading, empty, error | Partial | Global and route states exist, but coverage is inconsistent and no browser visual pass was possible. |
| Mobile and desktop | Unverified | Responsive classes exist. No browser/device matrix or screenshot was possible without an authenticated live environment. |

## Findings

### P0-01. PayPal completion is browser-return dependent

- **Severity:** P0
- **Exact reproduction:** Complete a PayPal payment, then close the PayPal tab before it returns to `/reports/{reportId}/unlock?tx=...`, interrupt the return request, or let the ShadowScore session expire before return. Query the report afterward. ShadowScore has received no server event that can settle the purchase.
- **Root cause:** `POST /api/payments/paypal/complete` accepts a transaction only from the report client, then uses PayPal PDT. There is no signed PayPal webhook, IPN endpoint, reconciliation job, or durable provider-event ingestion path.
- **File:** `app/api/payments/paypal/complete/route.ts`; `app/reports/[reportId]/ReportFlow.tsx`
- **Function:** `POST`; `paypalUrl`; the payment-return effect in `ReportFlow`
- **Estimated fix:** 5 to 8 engineering days, plus PayPal sandbox and production certification.

### P0-02. Payment settlement and report generation share one request

- **Severity:** P0
- **Exact reproduction:** Return from a completed PayPal payment while an evidence provider is slow, unavailable, or exceeds the hosting request timeout. The confirmation request runs report generation before responding. The customer can receive a payment error or remain in processing even though PayPal settled the transaction.
- **Root cause:** `POST` calls `markPaymentPaidAndGenerateReport` synchronously. That function updates payment state and runs the report pipeline in the same execution path instead of committing entitlement and enqueueing an idempotent job.
- **File:** `app/api/payments/paypal/complete/route.ts`; `lib/workspace.server.ts`
- **Function:** `POST`; `markPaymentPaidAndGenerateReport`
- **Estimated fix:** 8 to 12 engineering days, including durable jobs, retries, status transitions, and failure-injection tests.

### P0-03. Settlement has no immutable provider-event ledger or atomic transition

- **Severity:** P0
- **Exact reproduction:** Submit the same PayPal transaction concurrently for the same report, or terminate the server between payment intent, intake, and report updates. The in-process guard can reduce repeated work, but there is no database uniqueness constraint on the PayPal transaction and no single transaction that proves exactly-once entitlement.
- **Root cause:** The provider transaction ID is verified in the route but is not committed as a uniquely constrained settlement event. Payment, intake, and report state are patched as separate records.
- **File:** `app/api/payments/paypal/complete/route.ts`; `lib/workspace.server.ts`; `lib/workspace.ts`
- **Function:** `POST`; `markPaymentPaidAndGenerateReport`; `createPaymentIntent`
- **Estimated fix:** 4 to 6 engineering days, plus concurrency and replay tests.

### P1-01. Administrator reports fail the canonical Archive visibility contract

- **Severity:** P1
- **Exact reproduction:** Run `npm run test:admin-access`. The test `administrator generation stores a non-paid report in Archive-compatible state` fails because `app/archive/ArchiveClient.tsx` no longer recognizes the `admin_comped` report state expected by the admin report contract.
- **Root cause:** Archive was migrated to canonical Investigation projections, while the administrator report path and its regression test still depend on report payment-state filtering. The projection, access type, and Archive acceptance criteria were not reconciled during the persistence migration.
- **File:** `app/archive/ArchiveClient.tsx`; `app/archive/page.tsx`; `lib/adminReportAccess.ts`; `tests/admin-report-access.test.mjs`
- **Function:** `ArchiveClient`; `ArchivePage`; `generateAdministratorReport`
- **Estimated fix:** 1 to 2 engineering days to define the canonical rule, project it, and replace the source-pattern assertion with repository and route coverage.

### P1-02. Session restore stops at access-token expiry

- **Severity:** P1
- **Exact reproduction:** Sign in, keep the tab open beyond the one-hour cookie lifetime, then refresh a protected route. The proxy validates only the access-token cookie, clears it when invalid, and redirects to login. Although a refresh token is stored in `sessionStorage`, no restore path rotates it and re-establishes the server cookie.
- **Root cause:** Login creates two session representations with a fixed access-token lifetime. `getCurrentSession` deletes expired browser state, and the proxy has no server-owned refresh session.
- **File:** `lib/auth.ts`; `app/api/auth/session/route.ts`; `proxy.ts`
- **Function:** `persistSession`; `getCurrentSession`; `POST`; `proxy`
- **Estimated fix:** 4 to 6 engineering days to adopt one server-owned refresh strategy, rotate tokens, test revocation, and remove JavaScript access to long-lived refresh credentials.

### P1-03. Email verification is not a complete browser journey

- **Severity:** P1
- **Exact reproduction:** Enable Supabase email confirmation, create an account, and observe a signup response with a user but no access token. `toSession` throws the sign-in instruction. Open the confirmation email. There is no dedicated callback route in this application that exchanges callback parameters, restores the intended `returnTo`, and confirms the resulting server session.
- **Root cause:** Signup assumes an immediate access token for session persistence. The configured `redirect_to` is the site root, while authentication continuation is handled separately by login and client session code.
- **File:** `lib/auth.ts`; `app/signup/page.tsx`; `app/login/page.tsx`
- **Function:** `emailAuthPath`; `toSession`; `signupUser`
- **Estimated fix:** 2 to 4 engineering days, plus email-provider and link-expiry tests.

### P1-04. Archive has no connected archive action or archived-record query

- **Severity:** P1
- **Exact reproduction:** Open an owned ready Investigation or the Investigation list and attempt to archive it. The canonical API exposes GET and POST for the collection and only GET for a detail. No customer mutation calls `archiveInvestigation`. Open `/archive`; it filters for `status === "ready"`, not `archived`.
- **Root cause:** The domain lifecycle defines an archived state, but the Supabase repository interface and canonical routes implement only list, get, and create. Archive currently means completed reports rather than an archival lifecycle.
- **File:** `lib/investigation/lifecycle.ts`; `lib/investigation/workflowRepository.ts`; `app/api/investigations/[investigationId]/route.ts`; `app/archive/page.tsx`
- **Function:** `archiveInvestigation`; `InvestigationRepository`; `GET`; `ArchivePage`
- **Estimated fix:** 2 to 4 engineering days, including RLS-safe mutation, UI confirmation, list semantics, and route tests.

### P1-05. Live tenant isolation has not been certified

- **Severity:** P1
- **Exact reproduction:** In a production-like Supabase project, create users A and B in different organizations and user C as an active member of A's organization. Create an Investigation and report as A. Request both projection endpoints and every direct Investigation and report URL as B and C. This audit cannot perform the procedure because no project credentials or fixtures are present.
- **Root cause:** Current tests exercise contract functions and inspect migration policy text. They do not execute the deployed RLS policies against Supabase with multiple real JWTs and membership changes.
- **File:** `tests/investigation-access-contract.test.mjs`; `tests/canonical-investigation-persistence.test.mjs`; `lib/investigation/workflowRepository.ts`; `supabase/migrations/20260801020000_persist_tenant_investigations.sql`
- **Function:** access-contract test cases; `SupabaseInvestigationRepository.list`; `SupabaseInvestigationRepository.get`
- **Estimated fix:** 2 to 3 engineering days for a disposable Supabase integration suite and CI secret setup. Allow 1 additional day for membership revocation and concurrent access cases.

### P2-01. Customer navigation still exposes multiple product generations

- **Severity:** P2
- **Exact reproduction:** Build the application and inspect the route manifest, or navigate directly to `/dashboard`, `/workspace`, `/investigations`, `/reports`, `/archive`, `/report`, `/analysis`, `/admin`, and `/admin-lite`. These remain separate reachable product families with different shells, record models, and navigation language.
- **Root cause:** Canonical Investigations and Archive were introduced without retiring legacy dashboard, workspace, report, analysis, monitoring, and admin destinations.
- **File:** `proxy.ts`; `components/ShadowScoreLayout.tsx`; `app/dashboard/page.tsx`; `app/workspace/page.tsx`; `app/reports/page.tsx`; `app/report/page.tsx`
- **Function:** `config.matcher`; `ShadowScoreLayout`; route page components
- **Estimated fix:** 4 to 6 engineering days after stabilization, using server redirects and one authenticated shell.

### P2-02. Global authentication navigation becomes stale

- **Severity:** P2
- **Exact reproduction:** Load a public page while signed out, then sign in through client navigation and return without a full reload. The header captures `getCurrentUser()` once in `useState`. Repeat logout from Account and navigate Back to a cached public page. The header can continue to display its initial authentication state.
- **Root cause:** `ShadowScoreLayout` reads browser session state once and has no reactive session provider or server session prop.
- **File:** `components/ShadowScoreLayout.tsx`; `lib/auth.ts`
- **Function:** `ShadowScoreLayout`; `getCurrentUser`; `logoutUser`
- **Estimated fix:** 1 to 2 engineering days with a single session provider and navigation tests.

### P2-03. Loading, empty, and error experiences are inconsistent

- **Severity:** P2
- **Exact reproduction:** Compare direct navigation and refresh behavior for `/investigations`, `/investigations/{id}`, `/archive`, `/reports/{id}`, and `/workspace`. The app has global states and some route-specific states, but canonical Investigations and Archive do not provide route-local loading and error boundaries. Fail a projection request and compare the result with report client errors.
- **Root cause:** Async states were added by feature rather than through a shared authenticated route pattern.
- **File:** `app/loading.tsx`; `app/error.tsx`; `app/investigations/page.tsx`; `app/archive/page.tsx`; `components/AsyncState.tsx`
- **Function:** route page components; `AsyncState`
- **Estimated fix:** 2 to 3 engineering days, including slow-network and failure-state browser tests.

### P2-04. Mobile and desktop customer journeys lack browser regression coverage

- **Severity:** P2
- **Exact reproduction:** Run the complete authenticated purchase journey at 390 by 844 and 1440 by 900, including menu expansion, long target names, validation errors, PayPal return, tables, report sections, refresh, and Back. There is no automated browser suite or screenshot baseline that performs this matrix.
- **Root cause:** Current tests primarily inspect source contracts and call pure functions. They do not drive a browser against a production-like backend.
- **File:** `package.json`; `tests/beta-readiness-journey.test.mjs`; `scripts/validate-accessibility.mjs`
- **Function:** test scripts; accessibility validator
- **Estimated fix:** 3 to 5 engineering days for Playwright journeys, deterministic tenant/payment fixtures, and responsive snapshots.

### P3-01. Validation warnings reduce release signal

- **Severity:** P3
- **Exact reproduction:** Run `npm run validate:production`. ESLint reports nine warnings, including an unoptimized image in the live intake page, backup/public page image warnings, and unused test bindings. Node also reports repeated module-type reparsing warnings during tests.
- **Root cause:** Warning-free validation is not enforced, legacy files remain in lint scope, and the package module boundary is ambiguous for imported TypeScript modules.
- **File:** `app/intake/page.tsx`; `app/page-backup.tsx`; `public/page.tsx`; `tests/decision-workspace.test.mjs`; `package.json`
- **Function:** intake render; test fixtures; package configuration
- **Estimated fix:** 0.5 to 1 engineering day.

## Required stabilization gates

Task 4 should remain paused until all of these conditions are met:

1. **Payment recovery gate:** signed PayPal events, unique provider transactions, atomic entitlement, asynchronous generation, replay tests, and reconciliation are operational.
2. **Admin and Archive gate:** administrator-comped reports appear through the canonical tenant-safe Archive contract, and Archive lifecycle semantics are explicit.
3. **Authentication gate:** confirmation links, server-owned refresh, expiry, logout, refresh, Back, and direct URLs pass in a deployed browser journey.
4. **Tenant gate:** owner, active member, removed member, approved staff, and unrelated tenant cases pass against real Supabase RLS.
5. **Browser gate:** desktop and mobile journeys cover menus, duplicate routes, current-page navigation, refresh, Back, direct URLs, loading, empty, and error states.
6. **Payment sandbox gate:** locked, checkout, return, pending, paid, duplicate callback, abandoned return, delayed event, and generation failure pass with PayPal sandbox events.

## Commands and results

| Command | Result |
| --- | --- |
| `npm run test:investigation-access-contract` | Pass, 5 of 5 tests. |
| `npm run test:secure-logout` | Pass, 4 of 4 tests. |
| `npm run test:canonical-investigations` | Pass, 4 of 4 tests. |
| `npm run test:payment-flow` | Pass, 20 of 20 tests. These are contract tests, not PayPal sandbox tests. |
| `npm run test:admin-access` | **Fail, 4 of 5 tests.** Archive-compatible administrator visibility assertion failed. |
| `npm run test:beta-readiness` | Pass, 4 of 4 tests. These are source-level journey assertions. |
| `npm test` | Pass. Core platform, case, finding, decision, Trust Graph, and UI contract suites completed. |
| `npm run validate:production` | Pass with nine ESLint warnings and Node module-type warnings. |
| `npm run build` | Pass. Next.js compiled, TypeScript completed, and 78 pages were generated or registered. The same nine lint warnings remain. |

## Final recommendation

Keep Task 4 paused. Sprint 1 Tasks 1 to 3 are materially improved and their focused contracts pass. The product is still not safe for production payment traffic. Resolve P0-01 through P0-03 first. Then close the Admin Archive regression, certify authentication and tenant isolation against deployed services, and run the full PayPal sandbox and browser matrix. Navigation and UX cleanup should start only after those business-path gates pass.

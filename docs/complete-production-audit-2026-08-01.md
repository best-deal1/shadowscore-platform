# ShadowScore complete production audit

**Audit date:** 2026-08-01  
**Decision:** **NO-GO for production. Conditional NO-GO for an external beta.**  
**Scope:** Public acquisition, authentication, intake, checkout, PayPal, investigation lifecycle, workspace, archive, Executive Report, provider engine, administration, security, accessibility, performance, persistence, and release controls.

## Executive summary

ShadowScore contains substantial technical work. The provider runtime, evidence models, tenant-aware repositories, report contract, localization checks, and automated tests are stronger than a typical prototype. The current customer product is still split across several generations of architecture. A customer can enter an authenticated Investigations page backed by seeded process memory, a separate Supabase-backed Workspace, a separate report archive, and several demonstration intelligence products. The same repository therefore presents production UI over both durable customer records and demo records.

The primary production blocker is integrity, not visual polish. Payment completion depends on a browser return instead of a server webhook. Report generation runs inside that payment-return request. Sign-out leaves the server authentication cookie active. The canonical Investigations destination is populated by shared in-memory demo data and a hardcoded user. These conditions can cause paid purchases to remain locked, signed-out sessions to remain authorized, customer records to disappear, and demo businesses to appear as real account data.

The Executive Report has a sound eight-section contract and explicit evidence deduplication, but it still assembles generic commercial guidance from keyword templates. The paid pipeline leaves the headline risk and confidence scores undefined. Several report sections independently restate the same findings, risks, gaps, and next steps. This produces a long report with the appearance of depth but limited incremental business value.

The platform should not add features until the P0 and P1 backlog is closed. The recommended sequence is: secure session and payment state, establish one durable Investigation record, verify evidence and decision semantics, consolidate navigation, then tighten the Executive Report.

## Audit method and limits

This was a repository-level production audit, not a live penetration test or a live payment certification. The review included:

- Every page, layout, and route handler under `app/`.
- Shared navigation, workspace, monitoring, payment, and report components.
- Authentication, authorization, persistence, payment, investigation, report, provider, scoring, and evidence modules under `lib/`.
- Supabase migrations and row-level security policies.
- Existing product, customer-journey, architecture, commercial-readiness, and release documents.
- Automated production validation, the core test suite, lint, and a production build.
- Static searches for demo data, placeholders, browser storage, hardcoded identities, payment providers, authorization boundaries, and duplicate route families.

The following require a deployment with production credentials and were not certified by this audit: live PayPal settlement, refund and dispute handling, Supabase policy behavior against production data, email delivery, restore procedures, external provider terms and quotas, load behavior, accessibility with assistive technology, and browser/device compatibility.

## Release scorecard

| Area | Rating | Release finding |
| --- | --- | --- |
| Navigation and information architecture | Red | Canonical routes coexist with older, fully functional destinations and conflicting shells. |
| Authentication and session handling | Red | Browser and server session states diverge. Sign-out does not revoke or clear the server cookie. |
| Authorization and tenant isolation | Amber | RLS coverage exists, but access is fragmented across user and organization models and needs live verification. |
| Investigation lifecycle and persistence | Red | The canonical Investigations page uses seeded, global process memory rather than customer persistence. |
| Provider and evidence engine | Amber | Real DNS, TLS, RDAP, HTTP, and SEC sources exist. Coverage claims exceed supported authoritative intelligence. |
| Decision and scoring integrity | Red | Paid reports omit headline scores and combine several decision models with unclear precedence. |
| Executive Report | Amber | The contract is structured, but conclusions and actions remain repetitive and template-driven. |
| Payment and entitlements | Red | PayPal is browser-return dependent, synchronous, and has no webhook-led recovery ledger. |
| Workspace and archive | Red | Multiple stores and object models prevent a reliable single customer history. |
| Accessibility and localization | Amber | Guardrails pass, but automated coverage is narrow and authenticated surfaces contain hardcoded English. |
| Performance and operability | Amber | Shared HTTP reuse is good. Report generation and workspace hydration are expensive and weakly observable. |
| Automated quality gates | Green with warnings | Current validation, tests, and build pass. The gates do not exercise the principal production failure modes. |

## Prioritized findings

Effort uses engineering time for implementation and focused tests, excluding external certification or vendor approval.

### P0: Production blockers

#### P0-01. Canonical Investigations shows shared demo records

- **Problem:** `/investigations` reads `seededInvestigations` from a `globalThis` array. New records default to the hardcoded user `maya-chen`. Generated results include a fixed verification score of 78 and fixed evidence references.
- **Root cause:** The canonical product route was connected to `MemoryInvestigationRepository`, while the production intake, checkout, and report path evolved separately in `workspace.ts` and Supabase.
- **User impact:** Customers can see fictional businesses, cannot rely on ownership isolation, and lose changes on process restart or deployment. A server process can share the same demo list between visitors.
- **Recommended fix:** Make one Supabase-backed Investigation aggregate authoritative. Require the authenticated actor for every list, create, and read. Migrate intake, payment, evidence, report, and archive references into that aggregate. Remove seeded records and hardcoded users from production code.
- **Estimated implementation effort:** 5 to 8 engineering days, plus migration rehearsal.

#### P0-02. PayPal completion depends on the customer returning in the browser

- **Problem:** Payment is confirmed only when the PayPal return query contains `tx` and the client posts it to `/api/payments/paypal/complete`. There is no PayPal webhook or IPN ingestion path.
- **Root cause:** Payment Data Transfer was implemented as a browser callback rather than one input into a server-owned payment state machine.
- **User impact:** A successful payer who closes the tab, loses connectivity, blocks the return, or returns after session expiry can remain unpaid in ShadowScore. Support has no deterministic automated recovery path.
- **Recommended fix:** Add a signed PayPal webhook endpoint, store immutable provider events, deduplicate by PayPal event and transaction ID, reconcile intent state asynchronously, and make the return page a status reader only. Add a scheduled reconciliation job and an administrator recovery action with audit history.
- **Estimated implementation effort:** 5 to 8 engineering days, plus PayPal sandbox and production certification.

#### P0-03. Report generation runs inside payment confirmation

- **Problem:** The PayPal completion request marks rows as paid and immediately runs every provider and the full report pipeline before responding.
- **Root cause:** Payment settlement, investigation execution, and report materialization are one synchronous function rather than durable jobs with transactional transitions.
- **User impact:** Provider latency, timeout, process termination, or deployment can leave partially updated payment, intake, and report rows. Retrying payment confirmation may repeat external collection. A paid customer can receive a generic 400 response for an investigation failure.
- **Recommended fix:** Commit the verified payment event and entitlement atomically, enqueue an idempotent investigation job, return success, and let a worker execute pinned provider versions. Persist each stage and retry policy. Separate `payment_failed`, `generation_failed`, and `needs_review` states.
- **Estimated implementation effort:** 8 to 12 engineering days.

#### P0-04. Sign-out leaves the server session active

- **Problem:** Login copies the access token into an HTTP-only cookie. `logoutUser()` deletes only `sessionStorage`. There is no DELETE session endpoint to clear the cookie or revoke the Supabase refresh session.
- **Root cause:** Client session storage and the server authentication cookie have independent lifecycle management.
- **User impact:** After the interface reports sign-out, server-rendered workspace pages and cookie-authenticated APIs can remain authorized for up to one hour. This is material on shared devices.
- **Recommended fix:** Implement server-side sign-out that clears the cookie with matching attributes and calls the Supabase logout/revocation flow. Make the UI await it. Add integration tests proving that every protected page and API returns unauthorized after sign-out.
- **Estimated implementation effort:** 1 to 2 engineering days.

### P1: Must fix before Beta

#### P1-01. There is no single authenticated product or data source

- **Problem:** `/investigations`, `/workspace`, `/dashboard`, `/reports`, `/archive`, and `/cases` remain separate implementations. `/reports` exports the dashboard rather than redirecting to Archive. `/workspace` uses organization queue data, while `/investigations` uses memory and Archive uses the report store.
- **Root cause:** Product consolidation was documented but not completed at route, data, and navigation levels.
- **User impact:** The same customer sees different records depending on entry point. Browser back and saved bookmarks can reopen obsolete product models.
- **Recommended fix:** Choose `/investigations` and `/archive` as canonical. Issue server redirects from obsolete customer routes. Preserve only internal API compatibility. Use one authenticated shell and one query layer.
- **Estimated implementation effort:** 4 to 6 engineering days.

#### P1-02. Protected pages rely on client redirects and duplicate session sources

- **Problem:** Archive, Account, reports, Admin, and several other pages render client code, read `sessionStorage`, then redirect. Other workspace routes authenticate on the server from a cookie.
- **Root cause:** Authentication was added incrementally without a single server boundary or session refresh strategy.
- **User impact:** Protected UI can flash, history gains unwanted entries, direct requests behave inconsistently, and expired access tokens have no refresh path even though refresh tokens are stored in browser session data.
- **Recommended fix:** Centralize authentication in a server session module. Protect route groups before rendering, rotate tokens securely, avoid storing refresh tokens in JavaScript-readable storage, and preserve validated return URLs.
- **Estimated implementation effort:** 5 to 8 engineering days.

#### P1-03. Payment state changes are not atomic or protected by a provider-event ledger

- **Problem:** Payment intent, intake, and report rows are patched sequentially. A failure between patches creates contradictory states. Transaction IDs are not visibly persisted as unique settlement records.
- **Root cause:** Payment completion uses ordinary user-scoped REST updates rather than a database transaction or security-definer settlement function.
- **User impact:** Duplicate callbacks, concurrent requests, and partial failures can generate repeated work or leave a paid report locked. Finance reconciliation lacks a durable audit trail.
- **Recommended fix:** Add `payment_events` and `payment_transactions` tables with unique provider identifiers. Use one database transaction to validate allowed transitions, grant entitlement, and enqueue work. Never trust mutable price metadata for settlement.
- **Estimated implementation effort:** 4 to 6 engineering days.

#### P1-04. Payment recovery, refund, dispute, and cancellation states are incomplete

- **Problem:** The interface offers retry for a local failed status, but there is no documented automated recovery for abandoned checkout, delayed settlement, refund, reversal, chargeback, or duplicate payment.
- **Root cause:** The payment model represents checkout intent and paid status, not the full provider lifecycle.
- **User impact:** Customers and support cannot determine access after a payment exception. Refunded reports may retain entitlement. Duplicate purchases may require manual database work.
- **Recommended fix:** Define a payment state machine and entitlement policy for every PayPal event. Add customer status copy, support tooling, reconciliation, refund handling, and audit events. Test late and out-of-order events.
- **Estimated implementation effort:** 5 to 8 engineering days.

#### P1-05. Stripe and CardCom are copy concepts, not integrations

- **Problem:** Intake risk hints mention Stripe, while checkout supports PayPal only. There is no adapter contract or implemented Stripe or CardCom payment route.
- **Root cause:** Payment-provider names are mixed between investigated business signals and ShadowScore checkout strategy. Future integrations have no formal boundary.
- **User impact:** Stakeholders can mistake named providers for supported purchase methods. Adding a second acquirer would duplicate settlement logic and increase inconsistency.
- **Recommended fix:** State PayPal as the only current checkout method. Create a provider-neutral checkout and webhook interface only when a second provider is scheduled. Keep Stripe and CardCom in an approved roadmap document with acceptance criteria, not current product copy.
- **Estimated implementation effort:** 1 day for copy and scope correction. 8 to 15 days per certified integration later.

#### P1-06. Report access depends on fragmented user and organization authorization models

- **Problem:** Legacy reports and payment intents are owned by `user_id`, while newer cases, subjects, jobs, and evidence use organization membership. Admin access uses a profile role. The customer report UI downloads the entire workspace and finds a report in the browser.
- **Root cause:** The persistence model has accumulated user-scoped and workspace-scoped generations without one access service.
- **User impact:** Team membership changes, ownership transfer, and administrator access can produce inconsistent permissions. Broad workspace hydration increases the consequence of an RLS mistake.
- **Recommended fix:** Define report ownership as a scoped entitlement tied to an Investigation and organization. Resolve authorization on a dedicated server report endpoint. Return one report or a minimal list projection. Verify all RLS policies with two-tenant adversarial tests.
- **Estimated implementation effort:** 6 to 10 engineering days.

#### P1-07. Paid report headline scoring is incomplete

- **Problem:** `buildReadyReport` returns `riskScore: undefined`, `confidenceScore: undefined`, and empty `topFactors`, while other sections expose several decision-confidence concepts.
- **Root cause:** The risk engine, decision intelligence, scorecard, trust intelligence, and report presentation evolved as parallel models without one canonical mapping.
- **User impact:** A paid Executive Report can omit the metrics implied by stored report columns and product language. Different sections can appear contradictory even when each model is internally valid.
- **Recommended fix:** Approve one decision schema with outcome, confidence, coverage, material risks, and reasons. Either compute headline scores from a versioned policy or remove score promises everywhere. Persist the exact policy and evidence-set hash used.
- **Estimated implementation effort:** 5 to 8 engineering days, including product and risk review.

#### P1-08. Decision precedence is unclear

- **Problem:** The report carries outputs from the risk engine, canonical decision, decision intelligence, trust insights, investigation intelligence, scorecard, and narrative. `executiveRecommendation` chooses among them using fallbacks.
- **Root cause:** New reasoning layers were appended to the report payload rather than replacing or subordinating previous conclusions.
- **User impact:** Two sections can select different labels or confidence language. Auditors cannot identify which engine made the commercial decision.
- **Recommended fix:** Create one immutable Decision artifact. Other engines contribute cited inputs, not competing outcomes. Reject report materialization when decision fields disagree. Add contradiction fixtures across every supported evidence state.
- **Estimated implementation effort:** 6 to 10 engineering days.

#### P1-09. Provider coverage does not support the breadth of the commercial promise

- **Problem:** Real sources focus on website infrastructure and SEC data. The authoritative company provider supports U.S. public companies. The so-called Reputation provider is SEC filing search. Marketplace, payment, compliance, private registry, sanctions, litigation, beneficial ownership, and global corporate coverage are absent or limited.
- **Root cause:** Provider labels and report categories describe a target product, while production adapters cover a narrower technical set.
- **User impact:** A customer investigating a private or non-U.S. business may receive polished conclusions from web metadata without the corporate and regulatory intelligence expected from due diligence.
- **Recommended fix:** Publish a jurisdiction and entity-type coverage matrix. Rename capabilities to the exact source checked. Gate conclusions by required coverage. Return `insufficient_evidence` when authoritative sources are unavailable. Add contracted registry, sanctions, and marketplace sources only after legal and quality review.
- **Estimated implementation effort:** 3 to 5 days for truthful gating and copy. Provider expansion is a separate multi-sprint program.

#### P1-10. Provider health reports configuration, not observed health

- **Problem:** Several `health()` methods always return `healthy` without making a bounded probe or consulting recent execution telemetry.
- **Root cause:** Health metadata was implemented as registry introspection rather than operational health.
- **User impact:** Admin can see green providers during DNS, RDAP, SEC, or network failure. Incident response and report confidence may rely on false status.
- **Recommended fix:** Separate `configured`, `reachable`, `degraded`, and `unavailable`. Derive health from recent probes and execution success rates. Display age, sample size, latency, and last error.
- **Estimated implementation effort:** 3 to 5 engineering days.

#### P1-11. Executive Report recommendations remain generic and repetitive

- **Problem:** Commercial guidance is selected by keyword groups such as identity, payment, infrastructure, and registration. Generic fallback actions are appended even when findings already contain similar advice. The recommendation summary concatenates observation, sources, impact, and response into one long paragraph.
- **Root cause:** The report composes prose from reusable templates instead of producing a concise decision memo from material, ranked findings.
- **User impact:** Reports can read like generated templates, repeat the same control several times, and fail to distinguish transaction-specific financial exposure.
- **Recommended fix:** Use a governed recommendation model: action, owner, deadline, evidence required, release condition, and residual risk. Deduplicate semantically, rank by commercial materiality, and cap the executive section at three decision-critical actions. Keep detailed evidence in appendices.
- **Estimated implementation effort:** 4 to 7 engineering days plus editorial review.

#### P1-12. Report evidence can be syntactically deduplicated but semantically repeated

- **Problem:** Evidence grouping removes only exact normalized source, label, and value matches. The same domain, absence, or SEC record can flow through provider findings, business intelligence, risks, reasons, gaps, scorecards, and narrative sections.
- **Root cause:** Each downstream model creates its own identifiers and prose rather than referencing canonical evidence and finding IDs.
- **User impact:** Evidence counts and apparent corroboration can be inflated. Repetition makes the report longer without adding independent support.
- **Recommended fix:** Assign canonical evidence, assertion, finding, and recommendation IDs. Every report sentence should reference these artifacts. Count independent sources, not render occurrences. Add a semantic duplication review to report fixtures.
- **Estimated implementation effort:** 5 to 8 engineering days.

#### P1-13. Purchase promises exceed implemented delivery

- **Problem:** Checkout states that the Executive Report is available immediately and that evidence is preserved for download. Generation can fail or take provider-dependent time, and no clear report or evidence download control is present in the reviewed report flow.
- **Root cause:** Sales copy was not tied to operational service levels and verified UI capabilities.
- **User impact:** Customers can pay based on an inaccurate delivery promise and then lack the promised artifact. This creates support, chargeback, and consumer-protection risk.
- **Recommended fix:** State a measured delivery range and exception path. Add a tested PDF or evidence-package export before claiming download. Define retention and availability terms.
- **Estimated implementation effort:** 1 to 2 days for accurate copy. 4 to 8 days for production export and retention controls.

#### P1-14. Production readiness checks validate configuration contracts, not a deployed journey

- **Problem:** The validation suite passes while P0 session, payment recovery, and demo persistence defects remain. Accessibility validation covers four shared files. Core `npm test` omits many separately named suites.
- **Root cause:** Quality gates emphasize static invariants and fixtures but do not include a deployed, authenticated purchase-to-report journey or adversarial security cases.
- **User impact:** A green build can be promoted while the core paid workflow is unsafe or non-durable.
- **Recommended fix:** Add release-blocking tests for sign-out, two-tenant isolation, webhook replay, partial settlement failure, paid job retry, process restart, provider outage, report consistency, and archive retrieval. Run the full named suite matrix in CI.
- **Estimated implementation effort:** 5 to 8 engineering days.

### P2: Should improve

#### P2-01. Navigation consolidation is incomplete

- **Problem:** The public shell is relatively focused, but authenticated and legacy shells still expose Workspace, Reports, Monitoring, Alerts, History, Dashboard, Cases, and separate intelligence destinations.
- **Root cause:** Route and shell removal stopped after documenting the canonical Investigation, Evidence, Executive Report, Archive model.
- **User impact:** Customers cannot predict where work is saved or how to revisit it. Back and forward navigation crosses different shells and object vocabularies.
- **Recommended fix:** Use one authenticated navigation: Investigations, Archive, Account, Start Investigation. Remove obsolete links, add permanent redirects, and test every bookmarked route.
- **Estimated implementation effort:** 3 to 5 engineering days.

#### P2-02. Authentication copy and navigation state can become stale

- **Problem:** The shared shell reads the current user only at component initialization. Account sign-out changes storage and navigates without a server-aware global state update.
- **Root cause:** Authentication state is not provided by a reactive server-backed session context.
- **User impact:** Headers can display “Connected” after expiry or fail to update after authentication transitions until a reload.
- **Recommended fix:** Supply session state from the root server layout and update it through server actions or a single client provider. Provide clear expired-session recovery.
- **Estimated implementation effort:** 2 to 3 engineering days.

#### P2-03. Intake is too large and mixes product, classification, checkout draft, and lead capture

- **Problem:** `app/intake/page.tsx` is a very large client component with embedded rule data, UI stages, provider hints, session storage, lead capture, and checkout recovery.
- **Root cause:** Iterative feature additions remained in one route component.
- **User impact:** The flow is harder to test, loading and validation behavior are tightly coupled, and copy or business-rule changes can regress unrelated stages.
- **Recommended fix:** Split intake into typed steps and server-owned draft persistence. Move classification and commercial rules into versioned services. Define validation schemas and resume behavior for each step.
- **Estimated implementation effort:** 5 to 8 engineering days.

#### P2-04. Loading, empty, and error patterns are inconsistent

- **Problem:** Some routes provide `loading.tsx`, role-based alerts, and retry buttons. Others render plain text, silently replace errors, or rely on client effects. Investigation, Archive, monitoring, and admin surfaces use different patterns.
- **Root cause:** Async-state components exist but are not a required design-system primitive.
- **User impact:** Customers cannot distinguish empty accounts, unauthorized access, expired sessions, provider delays, and system failure.
- **Recommended fix:** Standardize skeleton, empty, unauthorized, recoverable error, terminal error, and offline states. Include next action, reference ID, and support path.
- **Estimated implementation effort:** 3 to 5 engineering days.

#### P2-05. Accessibility verification is too narrow

- **Problem:** The automated guard validates only four shared report and layout files. Large client flows, dialogs, status changes, filters, tables, charts, focus restoration, RTL interaction, and payment return are not comprehensively exercised.
- **Root cause:** Accessibility is enforced through static source heuristics rather than browser-level checks and manual acceptance criteria.
- **User impact:** Keyboard, screen-reader, low-vision, and RTL users may encounter regressions despite a passing gate.
- **Recommended fix:** Add axe checks to every canonical route and state, keyboard journey tests, focus management, live regions for payment and generation, contrast review, 200 percent zoom review, and manual screen-reader acceptance.
- **Estimated implementation effort:** 4 to 7 engineering days.

#### P2-06. Localization boundaries are inconsistent across authenticated products

- **Problem:** The public dictionaries cover six locales, but workspace navigation, Investigation status, Archive, report flow, and several operational pages contain hardcoded English. Two ShadowScore layout implementations coexist.
- **Root cause:** Localization was added by route family and is enforced selectively.
- **User impact:** Customers can switch language and enter partially translated workflows. RTL layout and terminology can change between pages.
- **Recommended fix:** Use one layout and one complete typed dictionary for canonical customer routes. Treat untranslated strings as a build error. Keep internal admin English-only only if explicitly scoped.
- **Estimated implementation effort:** 4 to 7 engineering days plus translation review.

#### P2-07. Workspace notes and several operational views imply persistence that is not present

- **Problem:** Analyst notes are stored in component state and labeled as a working record. Monitoring and intelligence demo routes also use demo or browser-local stores in places.
- **Root cause:** Prototype interaction patterns remain accessible alongside durable workspace capabilities.
- **User impact:** Users can believe notes, alerts, or decisions are saved when a refresh or another device cannot retrieve them.
- **Recommended fix:** Hide demo routes from customer builds. Persist every customer-editable record through authenticated repositories with timestamps and actors. Label any retained sandbox clearly and isolate it from production data.
- **Estimated implementation effort:** 3 to 6 engineering days.

#### P2-08. Archive has no archival lifecycle

- **Problem:** Archive is currently a filter for paid, ready reports. There is no archive action, retention state, version history, deletion policy, or distinction between completed and explicitly archived Investigations.
- **Root cause:** Archive was introduced as an information-architecture destination without completing its domain behavior.
- **User impact:** Customers cannot manage history or understand retention, and report retrieval depends on one current report record.
- **Recommended fix:** Define completed versus archived state, immutable report versions, retention, restore, deletion request handling, and export. Keep one canonical report link per Investigation with version history inside it.
- **Estimated implementation effort:** 5 to 8 engineering days.

#### P2-09. Admin surfaces are duplicated and authorization is inconsistent

- **Problem:** `/admin` reads a browser session and calls an API, `/admin-lite` uses a public email allowlist concept, and production report access uses a database role.
- **Root cause:** Operational tooling grew through separate access mechanisms.
- **User impact:** Staff can receive contradictory access, and a client-exposed email list is unsuitable as an authorization source.
- **Recommended fix:** Consolidate one server-protected Admin route group with database roles, least privilege, step-up authentication for financial actions, and immutable audit events. Retire Admin Lite.
- **Estimated implementation effort:** 4 to 6 engineering days.

#### P2-10. Report and workspace queries over-fetch

- **Problem:** Report pages call `getWorkspace()` and download intakes, payment intents, reports, legal acceptances, and related state before finding one report. Payment return repeats this load and processing polls it every five seconds.
- **Root cause:** A broad workspace snapshot is used as a convenience read model for focused screens.
- **User impact:** Latency and database load grow with account history. Polling duplicates expensive reads and increases exposure of unrelated data in the browser.
- **Recommended fix:** Add focused server endpoints and projections for report status, Investigation list, Archive list, and one report. Use event-driven updates or bounded backoff. Add indexes for ownership, status, payment intent, intake, and ready date based on query plans.
- **Estimated implementation effort:** 4 to 6 engineering days.

#### P2-11. Provider execution lacks production-grade network and source governance

- **Problem:** Providers use short global timeouts and direct public endpoints. Health, retries, quotas, caching, user-agent contacts, data licensing, source retention, and jurisdiction policy are not visibly governed end to end.
- **Root cause:** The provider layer prioritizes deterministic technical collection but has not completed operational and legal certification.
- **User impact:** Reports can vary by temporary network failure, sources can throttle requests, and data use can breach source terms or retention expectations.
- **Recommended fix:** Approve a provider runbook for each source: purpose, terms, coverage, timeout, retries, cache TTL, quota, circuit breaker, provenance, retention, escalation, and quality benchmark.
- **Estimated implementation effort:** 5 to 10 engineering days for current providers, excluding contracts.

#### P2-12. Observability does not connect purchase, job, evidence, decision, and report

- **Problem:** The code records several IDs and technical details, but there is no demonstrated end-to-end trace or customer-safe incident reference across payment and generation.
- **Root cause:** Telemetry was built per subsystem rather than around the Investigation lifecycle.
- **User impact:** Support cannot quickly explain where a paid Investigation stopped. Engineers may need to correlate browser reports and database rows manually.
- **Recommended fix:** Use one correlation ID from checkout through provider executions and report materialization. Emit structured state-transition events, latency, failure class, provider coverage, retry count, and entitlement outcome. Redact targets and tokens.
- **Estimated implementation effort:** 3 to 5 engineering days.

#### P2-13. Browser security controls need deployment verification

- **Problem:** The repository review did not establish enforced Content Security Policy, clickjacking policy, HSTS ownership, referrer policy, permissions policy, rate limits, CSRF strategy for cookie-authenticated mutations, or secret-redaction verification at the deployment edge.
- **Root cause:** Some controls may exist in hosting configuration, but they are not represented as a tested application contract.
- **User impact:** A configuration drift can weaken session and payment protection without failing CI.
- **Recommended fix:** Define headers and edge protections as code, add origin checks or CSRF tokens to cookie-authenticated mutations, rate-limit auth and payment endpoints, and validate deployed headers in release checks.
- **Estimated implementation effort:** 3 to 5 engineering days plus hosting configuration.

### P3: Nice to have

#### P3-01. Legacy and backup pages remain in the shipped source tree

- **Problem:** `page-backup.tsx`, old deployment notes, duplicate component paths, and historical route implementations increase search noise and accidental reuse.
- **Root cause:** Prior iterations were retained beside active code instead of archived through version control and canonical documentation.
- **User impact:** Limited direct impact, but maintenance becomes slower and regression risk increases.
- **Recommended fix:** Remove dead code, move durable historical decisions to an archive folder, and document canonical owners and entry points.
- **Estimated implementation effort:** 1 to 2 engineering days.

#### P3-02. Build and lint warnings reduce signal quality

- **Problem:** Node repeatedly reparses TypeScript modules because package module type is unspecified. Lint reports unoptimized image elements and unused test variables.
- **Root cause:** Tooling conventions and inactive source files have not been cleaned up.
- **User impact:** No immediate blocker, but real warnings are easier to miss and some images can harm LCP.
- **Recommended fix:** Resolve module-mode conventions after checking Next.js 16 guidance, remove inactive pages, optimize active images, and keep CI warning-free.
- **Estimated implementation effort:** 1 to 2 engineering days.

#### P3-03. Performance has no customer-facing service-level budget

- **Problem:** The code tracks some execution duration, but there are no stated budgets for preview, checkout, provider collection, report ready time, archive load, or report rendering.
- **Root cause:** Performance work focuses on implementation checks rather than user outcomes.
- **User impact:** Regressions can pass until customers report slow investigations.
- **Recommended fix:** Define p50, p95, and failure budgets by journey. Instrument Web Vitals, provider latency, queue delay, report materialization, payload size, and database query time.
- **Estimated implementation effort:** 2 to 4 engineering days.

#### P3-04. Report presentation needs print and executive reading validation

- **Problem:** The report component is comprehensive, but the audit found no release evidence for PDF pagination, print contrast, table splitting, source-link durability, or a timed executive comprehension test.
- **Root cause:** Report validation emphasizes the data contract rather than the delivered document experience.
- **User impact:** A correct on-screen report may be difficult to circulate in procurement, legal, or leadership workflows.
- **Recommended fix:** Test a fixed set of long and sparse reports in browser, print, and PDF. Conduct a five-minute comprehension review with decision makers and remove sections that do not change the decision.
- **Estimated implementation effort:** 3 to 5 engineering days.

## Executive Report section review

The eight-section contract is a useful foundation. The following disposition should guide the rewrite.

| Section | Current production concern | Required standard |
| --- | --- | --- |
| Executive decision | Outcome may be selected through fallback among several engines. The explanation is long and repeats the key finding. | One approved outcome, confidence, coverage statement, and decision expiry. Explain the top two reasons in plain language. |
| Business identity | Website-derived name and authoritative SEC identity can coexist. Private-business identity coverage is weak. | State the legal entity, trading identity, jurisdiction, identifiers, matching confidence, unresolved conflicts, and exact authoritative sources. |
| Key findings | Findings are grouped, but materiality and independence of sources are unclear. | Rank no more than five findings by commercial materiality. Separate facts, interpretations, and missing evidence. |
| Business impact | Generic impact templates can repeat finding text. | Quantify exposure when inputs allow it. Otherwise name the affected decision, failure mode, and residual uncertainty. |
| Recommended actions | Generic fallbacks and narrative actions overlap. | Provide action, owner, due date, evidence required, pass condition, and residual risk. Avoid advice that does not change the transaction. |
| Evidence reviewed | Exact deduplication exists, but semantic duplicates remain and “unavailable” can appear as evidence values. | Show independent sources, observation time, coverage, freshness, authority, and access link. Treat unavailable data as a gap, not positive evidence. |
| Method and limitations | Provider and engine versions are available in data but the commercial limitations are not prominent. | State jurisdiction, source coverage, collection failures, exclusions, decision policy version, evidence hash, and validity period. |
| Audit record | Execution details are extensive but oriented to engineers. | Preserve machine detail in an appendix. Present the customer with report ID, Investigation ID, version, generated time, reviewer state, and chain of custody. |

## Provider verification matrix

This matrix distinguishes live source adapters from product labels. “Implemented” means source code contains a real adapter. It does not certify production credentials, terms, availability, or result quality.

| Provider or capability | Observed source | Audit finding | Release action |
| --- | --- | --- | --- |
| TLS certificate | Node TLS connection | Implemented for domains. Useful technical evidence, not business identity proof. | Benchmark expiry, SAN, redirect, SNI, and failure cases. |
| DNS | Node DNS resolvers | Implemented for A, AAAA, MX, NS, TXT, and CNAME. | Distinguish absent records from transient resolver failure. Pin resolver and caching policy. |
| WHOIS | `rdap.org` | Implemented through an aggregator endpoint. Registration dates can be absent. | Validate authoritative bootstrap, rate limits, source attribution, and jurisdiction gaps. |
| HTTP security headers | Target website response | Implemented. Missing headers are currently low-severity technical findings. | Prevent repeated commercial conclusions and separate security posture from counterparty legitimacy. |
| SPF and DMARC | DNS TXT | Implemented. Absence is useful but not proof of fraud or business failure. | Calibrate contribution to decision confidence and handle DNS failure separately. |
| Public business profile | Website title and structured markup | Implemented as web extraction. It is self-asserted evidence. | Never promote it to legal identity without authoritative corroboration. |
| Authoritative company | SEC tickers and submissions | Implemented for U.S. public issuers. | Gate by supported entity type. Add coverage disclosure and verified domain-to-issuer matching. |
| Reputation | SEC full-text filing search | Misnamed. This is regulatory filing retrieval, not general reputation. | Rename it and validate classification precision. Add actual reputation sources only with governance. |
| Website metadata | Target website HTML | Implemented and shares the HTTP result. | Treat as descriptive self-assertion, not independent corroboration. |
| Contact discovery | Regex extraction from target HTML | Implemented with limited validation. | Validate source context, obfuscation, false positives, personal-data policy, and phone parsing. |
| Social profile discovery | Links on target website | Implemented. It proves a link was published, not ownership of the social account. | Label as claimed links and verify ownership only through a separate method. |
| Marketplace | Registry metadata exists, but no production adapter was established in this audit. | Capability promise exceeds evidence. | Mark unsupported or implement contracted marketplace evidence. |
| Payment intelligence | Registry metadata exists, but customer-entered hints are not authoritative payment-network evidence. | Capability promise exceeds evidence. | Separate checkout payments from investigated-business payment evidence. Do not infer account ownership without a source. |
| Compliance and sanctions | Registry metadata and report categories exceed demonstrated production sources. | Material due-diligence gap. | Add authoritative, jurisdiction-aware sources or return insufficient evidence. |

## Security review summary

### Controls observed

- Supabase access tokens are validated before the application sets an HTTP-only, secure-in-production, SameSite=Lax cookie.
- Legacy user-owned tables and newer workspace-owned tables enable row-level security.
- Report display checks paid or administrator-comped state plus ready status.
- Administrator report generation checks the database profile role and creates an audit record.
- PayPal PDT validation checks status, invoice, receiver, currency, and gross amount.
- Return URLs are constrained to local paths before navigation.

### Controls not yet certified

- Server-side logout and token revocation.
- Refresh-token rotation and expiry recovery.
- CSRF protection for cookie-authenticated mutations.
- Webhook signature validation, replay protection, and event ordering.
- End-to-end tenant isolation across legacy user and organization records.
- Administrative step-up authentication and financial least privilege.
- Rate limits for authentication, payment confirmation, providers, and expensive report generation.
- Deployed security headers, WAF behavior, secret redaction, backup encryption, restore, deletion, and retention.
- Live penetration testing, dependency scanning, software bill of materials, and incident response exercises.

## Performance review summary

### Positive observations

- Website-oriented providers reuse one shared HTTP acquisition result rather than fetching the target separately for metadata, headers, profile, contact, and social extraction.
- Several external operations use bounded timeouts and return structured diagnostics.
- Supabase queries usually include ownership filters and bounded limits for focused repository methods.

### Material concerns

- Payment requests execute the entire report pipeline synchronously.
- Report pages repeatedly hydrate a broad workspace snapshot, including during five-second polling.
- Several provider operations run direct network calls without a demonstrated shared circuit breaker, bounded retry budget, or workload queue.
- Investigation lists and demo stores have no production pagination contract.
- The report payload contains many overlapping derived graphs and narratives, increasing serialization, browser memory, and rendering cost.
- No database query plans, production latency distribution, load test, or Web Vitals evidence was found in the release contract.

## Required release plan

### Gate 1: Integrity and recovery

Close P0-01 through P0-04. Demonstrate process restart, session sign-out, PayPal webhook replay, browser abandonment, provider failure, and paid job retry in a production-like environment.

### Gate 2: One product record

Close P1-01, P1-02, P1-06, and P2-01. One authenticated customer must see the same Investigation state from the home list, detail page, payment return, Archive, and Executive Report. A second tenant must see none of it.

### Gate 3: Decision and report integrity

Close P1-07 through P1-13. Approve the provider coverage matrix and canonical Decision artifact. Review at least 20 real-world reports across public, private, supported, unsupported, sparse, contradictory, and provider-failure cases.

### Gate 4: Operational beta

Close P1-14 and the security items in P2-13. Run a complete sandbox purchase, refund, delayed event, duplicate event, failed job, admin recovery, export, and Archive retrieval. Record evidence in the release checklist.

## Definition of Beta ready

ShadowScore is ready for an external beta only when all of the following are true:

1. No P0 or P1 item remains open.
2. Every customer-visible Investigation is durable, authenticated, tenant-isolated, and recoverable.
3. Payment settlement is server-led, idempotent, auditable, and independent of browser return.
4. One canonical Decision artifact drives every report conclusion and confidence statement.
5. Unsupported provider coverage produces an explicit insufficient-evidence result.
6. The Executive Report contains no placeholder metric, duplicate conclusion, unsupported source claim, or generic action that does not follow from cited evidence.
7. Canonical navigation contains only Investigations, Archive, Account, and Start Investigation after sign-in.
8. A paid report can be retrieved after sign-out, sign-in on another device, process restart, and deployment.
9. The full CI matrix, production build, deployed journey tests, tenant tests, accessibility checks, and security header checks pass without unexplained warnings.
10. Support has a runbook for payment exceptions, report failures, data correction, access disputes, refunds, and deletion requests.

## Final recommendation

Freeze feature development. Treat the next milestone as a production-integrity program, not a design sprint. Start with payment and session safety, then unify the Investigation record. Do not polish or expand monitoring, Trust Intelligence, Risk Radar, marketplace intelligence, or additional payment providers until the paid core journey is durable and the Executive Report has one defensible decision model.

# ShadowScore Production Recovery Roadmap

**Roadmap date:** 2026-08-01

**Status:** Approved planning baseline

**Release position:** No-go for production. Conditional no-go for external beta.

**Implementation boundary:** This document defines work only. It does not authorize implementation.

**Active delivery slice:** [Production Recovery Sprint 1](./sprint-1-production-recovery.md)

## Purpose

This roadmap converts the complete production audit and prior product decisions into one recovery program. The audit is the factual baseline. Product requirements such as administrator access, complimentary report access, payment expansion, canonical navigation, page-level polish, and Investigation-wide data consistency are part of the recovery scope rather than optional additions.

The program has one outcome: a customer can start one durable Investigation, pay through a supported provider, receive one evidence-backed Executive Report, and retrieve it later. Staff can support that journey through controlled administrator tools. Every state must be secure, recoverable, observable, and consistent across the product.

Feature development remains frozen until the beta gates in this roadmap are complete. New work may enter the recovery program only when it closes an audited risk, satisfies an acceptance criterion below, or is required to operate the canonical customer journey.

## Sources and precedence

This roadmap combines:

- `docs/complete-production-audit-2026-08-01.md`, which is the production risk baseline.
- `docs/product-freeze-review.md`, which defines the canonical product model and vocabulary.
- `docs/customer-journey-review.md`, which defines customer trust and journey acceptance needs.
- `docs/PRODUCTION_ARCHITECTURE.md` and `PRODUCT_ARCHITECTURE.md`, which define engine and platform boundaries.
- `PROVIDER_FRAMEWORK.md` and the provider validation records, which define the current provider contract and coverage limits.
- `docs/admin-access.md`, which defines the current database-role basis for administrator access.
- Existing payment, report, security, quality, and release documentation.

When documents conflict, use this order:

1. Verified production behavior and security controls.
2. The complete production audit.
3. This roadmap and the product freeze decisions.
4. Earlier architecture and release documents.

Earlier readiness statements are historical evidence, not release approval. In particular, a passing configuration or build check does not override the audit's no-go decision. Production and beta require the exit gates in this roadmap.

## Program rules

1. **One primary object:** Investigation is the durable aggregate for intake, payment entitlement, collection, evidence, decision, report, activity, and archive state.
2. **One customer deliverable:** Executive Report is the only customer-facing report name.
3. **One source of truth:** Every customer and administrator screen reads the same Investigation and report records through scoped server APIs.
4. **One navigation model:** Public and authenticated menus use their approved canonical items. Legacy routes redirect instead of presenting parallel products.
5. **Server-owned trust boundaries:** Authentication, authorization, payment settlement, complimentary access, impersonation, and report access are decided on the server and recorded in immutable audit events.
6. **Evidence before conclusions:** A Decision references canonical findings and evidence. Report prose does not create new facts or competing outcomes.
7. **Truthful capability claims:** Product copy reflects active payment methods, provider coverage, delivery timing, export behavior, and retention policy.
8. **Recovery by design:** Payment, job, provider, and report transitions are idempotent and resumable. A browser return is never the sole recovery mechanism.
9. **Quality is measured across the journey:** Release checks cover deployed behavior, tenant isolation, accessibility, performance, failure recovery, and report quality.
10. **No hidden expansion:** Stripe, CardCom, new intelligence providers, monitoring, and other future capabilities pass explicit readiness gates before customer exposure.

## Canonical target state

### Customer structure

```text
Public
├── Product
├── Sample Executive Report
├── Methodology
├── Pricing
├── Security
├── Sign in
└── Start Investigation

Authenticated
├── Investigations
│   ├── Start Investigation
│   └── Investigation
│       ├── Overview
│       ├── Evidence
│       ├── Activity
│       └── Executive Report
├── Archive
└── Account
```

The authenticated product has one primary menu. It contains Investigations and Archive. Account is a utility, and Start Investigation is the primary action. Dashboard, Workspace, Cases, Reports, Command Center, Risk Radar, Monitoring, Watchlist, and Alerts are not primary customer destinations.

There is one public Security page and one link to it in each applicable menu. Selecting the current navigation item remains a valid action. It reloads or refreshes the canonical destination without producing a disabled or misleading control.

### Investigation lifecycle

The final state model must distinguish these concerns:

- Investigation state, including draft, awaiting payment, queued, collecting, evaluating, ready, failed, needs review, completed, and archived.
- Payment state, including created, pending, processing, settled, failed, cancelled, expired, refunded, reversed, disputed, and duplicate.
- Entitlement source, including paid, complimentary, administrative, refunded with retained access, and revoked.
- Report state and immutable report versions.
- Provider execution state and coverage.

Exact names require a domain decision before schema work. Every transition must define its actor, preconditions, idempotency key, persisted event, customer presentation, retry policy, and terminal recovery path.

### Administrator operating model

Administrator access uses authenticated database roles. It does not use a browser flag, query parameter, public email list, or client-only decision.

The target Admin area provides:

- A dashboard for Investigations, payments, report jobs, provider health, failures, and support queues.
- Read access to every customer report through an audited server authorization path.
- Complimentary access, also called Comp, which unlocks a report without a customer payment while preserving the normal Investigation and report pipeline.
- Customer impersonation for support, with a visible banner, reason, time limit, original actor identity, and complete audit history.
- Recovery actions for payment reconciliation and failed generation.
- Least-privilege roles and step-up authentication for impersonation, Comp, refunds, entitlement changes, and other sensitive actions.

Admin access does not bypass data integrity. Comp creates a typed entitlement event. Impersonation preserves both the administrator and customer identities. Opening any report creates an access event.

### Payment provider model

PayPal remains the active payment method. The recovery architecture introduces a provider-neutral contract for checkout creation, signed event verification, normalization, reconciliation, refunds, disputes, and provider references. The platform owns the payment and entitlement state machine.

Stripe and CardCom remain planned integrations. They do not appear as available payment methods until their adapters, webhooks, certification, reconciliation, refund behavior, localization, and journey tests pass. Provider abstraction must follow verified PayPal behavior rather than predict a lowest-common-denominator API.

## Delivery sequence and release gates

Workstreams run as one dependency-led program. Estimates are engineering effort ranges, not calendar promises. They include implementation and focused automated tests. They exclude vendor contracting, external certification, translation procurement, live penetration testing, and waiting time. Parallel work can reduce elapsed time only after shared contracts are approved.

| Phase | Objective | Primary workstreams | Exit gate |
| --- | --- | --- | --- |
| 0 | Approve contracts and stop architectural drift | A, B, C, D, E, G | Investigation, session, authorization, payment, entitlement, evidence, Decision, and Admin contracts are approved. |
| 1 | Restore integrity and recovery | A, B, C, G, I | No shared demo data, sign-out is complete, settlement is webhook-led and atomic, paid work is durable, sensitive Admin actions are audited. |
| 2 | Establish one product record | A, F, G, H | Every canonical screen uses one Investigation source, obsolete routes redirect, focused queries replace workspace hydration. |
| 3 | Establish investigation and report quality | D, E, H | One Decision governs each report, duplicated findings are controlled, coverage limits are visible, report output passes editorial and fixture review. |
| 4 | Operational beta | All | The full deployed journey passes security, accessibility, performance, recovery, support, and report-quality acceptance. |
| 5 | Production certification | C, D, G, H, I | Live PayPal, providers, backups, restore, incident response, and production controls are certified with recorded evidence. |

P0 work starts first, but it does not run as an isolated bug queue. For example, durable Investigation work uses the approved canonical object, payment settlement uses the future provider boundary, and sign-out uses the final server session model. This prevents recovery work from reinforcing obsolete architecture.

## Workstream A: Core platform

**Objective:** Make one durable, tenant-scoped Investigation the authoritative product record.

**Audit coverage:** P0-01, P1-01, P1-06, P2-07, P2-08, P3-01.

### Scope

1. Approve the Investigation aggregate, identifiers, lifecycle, ownership, organization scope, report versions, entitlement references, and archive behavior.
2. Replace the seeded global Investigation repository and hardcoded actor with production persistence. Keep deterministic fixtures inside tests only.
3. Migrate intake, checkout, provider jobs, evidence, decisions, reports, activity, and archive entries to the same Investigation identity.
4. Create server read models for Investigation list, Investigation detail, report status, one Executive Report, and Archive.
5. Define migration, rollback, compatibility, and reconciliation for existing user-scoped and organization-scoped records.
6. Persist every customer-editable record that the UI presents as saved. Remove or isolate demonstration and browser-local operational records.
7. Define completed, archived, restored, retained, exported, and deletion-request behavior. Preserve immutable report versions.
8. Remove dead customer routes and duplicate implementations after redirects and migration telemetry show that they are unused.

### Deliverables

- Approved aggregate and lifecycle decision record.
- Supabase schema and RLS migration plan with rehearsed rollback.
- Canonical repository and focused server query contracts.
- Legacy record migration and exception report.
- Archive and retention policy.
- Two-tenant and process-restart test suite.

### Acceptance criteria

- A customer sees only Investigations authorized for the active organization.
- The same Investigation ID appears from intake through Archive and every report version.
- Restarting or redeploying the application does not change customer records.
- No production customer surface loads seeded or shared records.
- Direct report access returns only the requested authorized report.
- Every migrated record is reconciled or placed in a documented review queue.

**Estimate:** 18 to 28 engineering days.

**Dependencies:** Phase 0 domain decisions. Coordinates with B, C, D, E, F, and G.

## Workstream B: Authentication

**Objective:** Establish one server-controlled session and authorization boundary for customer and staff routes.

**Audit coverage:** P0-04, P1-02, P1-06, P2-02, P2-13.

### Scope

1. Centralize session creation, refresh, expiry, revocation, and sign-out.
2. Clear the server cookie with matching attributes and revoke the Supabase session when the customer signs out.
3. Protect authenticated route groups and APIs before rendering. Remove client-only authorization decisions and JavaScript-readable refresh-token handling.
4. Provide one reactive session state to the authenticated shell. Define expired-session and validated return-path behavior.
5. Centralize organization membership, report entitlement, administrator role, and impersonation authorization in server services.
6. Add CSRF or origin protection for cookie-authenticated mutations, rate limits for authentication and sensitive endpoints, and deployment-tested browser security headers.
7. Verify authorization with anonymous, expired, revoked, cross-tenant, role-change, and impersonation cases.

### Deliverables

- Session and authorization threat model.
- Server session module and protected route boundary.
- Sign-out and revocation flow.
- Central access policy service.
- Adversarial authentication and authorization tests.

### Acceptance criteria

- After sign-out, every protected page and API rejects the old browser and server session.
- Protected content never renders before authorization.
- Role and organization changes take effect within a defined maximum interval.
- A user cannot access another tenant's Investigation by changing an identifier.
- Authentication state and navigation update together without a stale connected state.

**Estimate:** 12 to 18 engineering days.

**Dependencies:** A ownership contract. Provides security boundaries for C, F, and G.

## Workstream C: Payment

**Objective:** Make payment and report entitlement provider-neutral, durable, asynchronous, and recoverable.

**Audit coverage:** P0-02, P0-03, P1-03, P1-04, P1-05, P1-13.

### Scope

1. Approve payment, transaction, provider-event, entitlement, and investigation-job state machines.
2. Keep PayPal checkout. Add signed PayPal webhook ingestion, immutable provider events, event and transaction deduplication, and scheduled reconciliation.
3. Settle payment, grant entitlement, and enqueue Investigation work in one database transaction.
4. Move provider collection and report materialization out of payment confirmation into idempotent jobs with persisted attempts and bounded retries.
5. Make browser return pages status readers. Provide accurate pending, delayed, failed, cancelled, refunded, disputed, and recovery states.
6. Define entitlement behavior for refund, reversal, chargeback, duplicate payment, Comp, and administrative override.
7. Introduce a payment adapter boundary for checkout, event verification and normalization, reconciliation, refund references, and provider capabilities.
8. Prepare Stripe and CardCom integration specifications, including event mapping, currency and locale behavior, hosted checkout or PCI boundary, certification, and acceptance fixtures.
9. Remove unsupported provider claims from current checkout copy. Tie delivery timing, download, and retention claims to measured capabilities.

### Provider rollout gates

| Provider | Roadmap status | Enablement gate | Incremental estimate |
| --- | --- | --- | --- |
| PayPal | Active, recovery required | Signed webhooks, atomic settlement, reconciliation, refund and dispute policy, sandbox and live certification | Included below |
| Stripe | Planned | Adapter, hosted checkout decision, signed webhooks, idempotency, reconciliation, refunds and disputes, tax and currency review, certification | 8 to 15 engineering days plus certification |
| CardCom | Planned | Adapter, supported transaction flow, signed callback or webhook verification, Israeli currency and document requirements, reconciliation, refunds, Hebrew and RTL review, certification | 10 to 18 engineering days plus certification |

### Deliverables

- Provider-neutral payment contract and transition table.
- PayPal event ledger, webhook, reconciliation job, and support recovery path.
- Durable Investigation job queue and worker behavior.
- Finance reconciliation and exception report.
- Stripe and CardCom implementation specifications and test fixture contracts.

### Acceptance criteria

- A settled PayPal transaction unlocks the correct Investigation without a browser return.
- Duplicate, late, and out-of-order provider events cannot duplicate entitlement or collection work.
- Payment settlement remains committed when report generation fails.
- A failed job resumes without recollecting completed provider work unless policy requires it.
- Finance can reconcile provider transactions, platform payments, entitlements, refunds, and exceptions.
- Only certified and enabled providers appear as payment choices.

**Estimate:** 22 to 34 engineering days for provider architecture, PayPal recovery, and asynchronous generation. Stripe and CardCom estimates are separate and begin after PayPal certification.

**Dependencies:** A Investigation identity, B actor authorization, G recovery policy, I observability.

## Workstream D: Investigation Engine

**Objective:** Produce reproducible, coverage-aware findings from governed providers without duplicated or unsupported reasoning.

**Audit coverage:** P1-08, P1-09, P1-10, P1-12, P2-11.

### Scope

1. Define canonical Evidence, Assertion, Finding, Gap, Recommendation, and Decision identifiers and lineage.
2. Normalize repeated observations before reasoning. Distinguish independent corroboration from repeated rendering of one source.
3. Review every report fixture and a governed corpus of generated reports. Record duplicate findings, unsupported conclusions, contradictions, and missing evidence.
4. Establish one Decision artifact. Risk, trust, identity, scorecard, and intelligence layers contribute typed inputs rather than competing outcomes.
5. Version provider plans, source snapshots, normalization rules, evidence-set hashes, decision policies, and report inputs for reproducibility.
6. Publish provider coverage by jurisdiction, entity type, source authority, freshness, and known limitation. Gate conclusions when required coverage is absent.
7. Rename capabilities to the source actually checked. Treat unavailable data as a gap, not evidence.
8. Replace configured-only provider health with observed reachability, success rate, latency, sample size, last success, and last error.
9. Approve a source runbook for terms, purpose, quotas, timeout, retry, caching, circuit breaker, retention, privacy, and escalation.
10. Build a provider roadmap based on decision value. Prioritize authoritative business registry, sanctions, and compliance coverage before broad marketplace claims. Each new source requires legal and quality approval.

### Deliverables

- Canonical reasoning artifact schema and lineage rules.
- Semantic deduplication policy and golden report corpus.
- Decision precedence contract and contradiction tests.
- Public coverage matrix and internal provider runbooks.
- Observed provider health model.
- Ranked provider expansion backlog with evidence-value criteria.

### Acceptance criteria

- Every material report statement traces to a canonical finding and evidence or is labeled as a gap or interpretation.
- Repeating one observation across engines does not increase evidence or corroboration counts.
- A report cannot materialize when outcome, confidence, or required evidence fields conflict.
- Unsupported entity types and jurisdictions return a clear coverage limitation or `insufficient_evidence` outcome.
- Reviewers approve every golden report for factual support, distinct findings, decision consistency, and useful next actions.

**Estimate:** 24 to 38 engineering days for current providers and reasoning. New contracted providers are separate initiatives.

**Dependencies:** A canonical records, C durable jobs. Supplies E report content and G provider operations.

## Workstream E: Executive Report

**Objective:** Deliver a concise, decision-ready report whose conclusions, evidence, and actions are consistent and useful.

**Audit coverage:** P1-07, P1-08, P1-11, P1-12, P1-13, P3-04.

### Scope

1. Preserve the approved eight-section contract while assigning one job to each section.
2. Present one outcome, confidence, coverage statement, decision expiry, and at most two primary reasons in the executive decision.
3. Rank no more than five findings by commercial materiality. Separate observed facts, interpretations, and missing evidence.
4. Resolve headline scoring. Approve a versioned score policy or remove score promises and empty score fields from product surfaces.
5. Replace generic recommendations with governed actions containing owner, due date, evidence required, pass condition, and residual risk. Cap the executive view at three decision-critical actions.
6. Reference canonical evidence and findings rather than restating them. Move technical detail and complete evidence lists to supporting sections or export.
7. State delivery timing, retention, sharing, export, and failure recovery accurately.
8. Implement and certify printable and PDF output only before download claims are enabled. Validate pagination, contrast, table splitting, source links, long content, and sparse content.
9. Conduct editorial review and timed comprehension testing with representative decision makers.

### Section quality standard

| Report area | Required outcome |
| --- | --- |
| Executive decision | One outcome, confidence, coverage, expiry, and concise reasons. |
| Business identity | Legal and trading identity, jurisdiction, identifiers, match confidence, conflicts, and authoritative sources. |
| Key findings | Up to five independent, material findings with fact and interpretation separated. |
| Business impact | Affected decision, failure mode, exposure when measurable, and residual uncertainty. |
| Recommended actions | Owner, timing, required evidence, pass condition, and residual risk. |
| Evidence reviewed | Independent sources, authority, freshness, observation time, coverage, and durable reference. |
| Limitations | Missing or unavailable evidence, unsupported coverage, and effect on confidence. |
| Method and appendix | Reproducible versions and supporting detail without competing decisions. |

### Deliverables

- Approved Decision-to-report mapping.
- Revised report composition and recommendation policy.
- Golden corpus with semantic and editorial review records.
- Print, PDF, sharing, and retention specification.
- Five-minute executive comprehension results.

### Acceptance criteria

- A reviewer can identify the decision, confidence, top reasons, limitations, and next actions within five minutes.
- No section introduces a competing outcome or unsupported score.
- Each recommendation changes the transaction or verification plan and is not duplicated elsewhere.
- Evidence counts represent independent sources rather than repeated mentions.
- Exported reports retain readable structure and durable evidence references.

**Estimate:** 16 to 25 engineering days, plus product, risk, legal, and editorial review.

**Dependencies:** D artifact and Decision contracts, A report versions, F design primitives.

## Workstream F: UX

**Objective:** Make every canonical page clear, consistent, accessible, responsive, and connected to the same Investigation.

**Audit coverage:** P1-01, P1-13, P2-01 through P2-08, P3-04.

### Scope

1. Inventory every public, authenticated, payment, report, and error route. Record purpose, source of data, navigation shell, vocabulary, responsive behavior, accessibility, loading, empty, error, and recovery states.
2. Use one public shell and one authenticated shell. Remove the duplicated Security destination and any duplicated Security navigation item.
3. Implement the approved public and authenticated menus. Keep current items interactive and ensure current-page actions resolve to the canonical URL.
4. Add permanent redirects for legacy destinations and test bookmarks, browser history, back, forward, refresh, and validated return paths.
5. Simplify intake into typed, resumable steps. Confirm the Business match and material scope before payment.
6. Standardize skeleton, empty, unauthorized, expired session, offline, recoverable error, terminal error, payment pending, and generation pending states. Every state provides a next action and incident reference where relevant.
7. Apply the same Investigation identity and status presentation across Investigations, detail, payment, Executive Report, and Archive.
8. Review every page visually at supported breakpoints, themes, locales, RTL, 200 percent zoom, keyboard navigation, and screen-reader flows.
9. Complete typed localization coverage for canonical customer routes. Internal Admin may remain English-only only through an explicit product decision.
10. Validate the complete first-customer and repeat-customer journeys. Prioritize abandonment, purchase misunderstanding, report trust, sharing, retrieval, and repeat purchase over subjective polish.

### Page review record

Each route must receive a signed review record containing:

- Canonical purpose and primary action.
- Data source and Investigation identifier behavior.
- Navigation and current-item behavior.
- Copy and vocabulary review.
- Loading, empty, error, expired, offline, and recovery states.
- Keyboard, focus, screen-reader, contrast, zoom, responsive, locale, and RTL results.
- Analytics events and observed journey friction.
- Screenshot or test evidence for each supported state.

### Deliverables

- Route, copy, and data-source inventory.
- Canonical navigation and redirect map.
- Shared asynchronous-state and feedback patterns.
- Page-level visual and accessibility review ledger.
- First-customer and repeat-purchase acceptance results.

### Acceptance criteria

- Each customer route belongs to the canonical structure or redirects to it.
- Security appears once in the applicable primary navigation.
- Selecting the current navigation item works consistently.
- Every page showing an Investigation uses the canonical ID and current persisted state.
- No customer-facing canonical route contains frozen product nouns or untranslated strings.
- Core journeys pass keyboard, screen-reader, responsive, zoom, locale, and RTL checks.

**Estimate:** 24 to 36 engineering days, plus translation and moderated user-review time.

**Dependencies:** A and B canonical data and session boundaries. Coordinates with C payment states, E report, and G Admin.

## Workstream G: Admin

**Objective:** Give authorized staff complete, controlled tools to support customers and operate the platform.

**Audit coverage:** P1-06, P1-10, P2-09, P2-12, plus approved Admin and Comp requirements.

### Scope

1. Consolidate Admin and Admin Lite into one server-protected route group backed by database roles.
2. Define least-privilege staff roles for support, analyst review, finance, operations, and full administration.
3. Build an Admin dashboard for Investigation status, payment exceptions, report jobs, provider health, support incidents, and recent sensitive actions.
4. Allow authorized administrators to locate and open every report through a dedicated server endpoint. Record actor, customer, Investigation, purpose, and time.
5. Implement Comp as an explicit entitlement grant with reason, approver, scope, expiration or permanence, and audit event. It uses the normal generation pipeline and does not create a fake payment.
6. Implement customer impersonation with a required reason, step-up authentication, short expiry, clear persistent banner, exit control, original actor propagation, and blocked high-risk actions where appropriate.
7. Add idempotent recovery tools for payment reconciliation, job retry, review release, entitlement correction, and provider incident handling.
8. Provide immutable audit search and export. Prevent administrators from editing or deleting their own security events.

### Deliverables

- Role and permission matrix.
- Sensitive-action threat model and approval policy.
- Unified Admin information architecture and dashboard.
- Audited report access, Comp, impersonation, and recovery workflows.
- Admin acceptance and abuse-case test suite.

### Acceptance criteria

- A normal customer cannot reach Admin data or actions by route, API, or role manipulation.
- An authorized administrator can find and open every report without changing customer ownership.
- Comp unlocks exactly the intended report and records who approved it and why.
- Every impersonated request preserves both actor identities, and the interface always shows impersonation state.
- Financial and entitlement actions require the approved role and step-up control.
- Sensitive actions are searchable through immutable audit history.

**Estimate:** 18 to 28 engineering days.

**Dependencies:** A Investigation and entitlement model, B auth, C payment recovery, D provider health, I audit telemetry.

## Workstream H: Performance

**Objective:** Set and enforce customer-facing performance budgets across the Investigation lifecycle.

**Audit coverage:** P2-10, P2-12, P3-02, P3-03.

### Scope

1. Define p50, p95, error-rate, and payload budgets for public navigation, intake save, checkout, payment status, Investigation list, detail, Archive, report render, queue delay, provider collection, and report ready time.
2. Replace broad workspace hydration with focused projections and indexed queries. Validate query plans against representative account sizes.
3. Use bounded backoff or event-driven status updates instead of unbounded expensive polling.
4. Instrument Web Vitals, server latency, database time, queue delay, provider latency, report materialization, payload size, and cache behavior.
5. Load-test concurrent payment events, queued Investigations, Archive history, report reads, and administrator searches.
6. Resolve active build and lint warnings so CI performance and correctness signals remain visible.

### Deliverables

- Approved service-level objectives and error budgets.
- Query and payload budget report.
- Load model, test scripts, and baseline results.
- Performance dashboards and regression thresholds.

### Acceptance criteria

- Every canonical journey has a measured p50, p95, failure rate, and owner.
- Focused screens do not download unrelated workspace or report records.
- Load tests meet approved budgets at the expected beta and production concurrency with documented headroom.
- CI fails on agreed performance regressions and ships without unexplained warnings.

**Estimate:** 12 to 20 engineering days.

**Dependencies:** A focused queries, C jobs, D provider telemetry, F canonical screens, I observability.

## Workstream I: Production hardening

**Objective:** Prove that the deployed product is secure, recoverable, supportable, and releasable.

**Audit coverage:** P1-14, P2-05, P2-11 through P2-13, P3-02 and P3-03.

### Scope

1. Replace configuration-only confidence with a deployed acceptance environment using production-equivalent infrastructure and sanitized test accounts.
2. Run the complete named test suite in CI. Add release-blocking journeys for sign-out, tenant isolation, webhook replay, partial settlement failure, job retry, process restart, provider outage, report consistency, Archive retrieval, Comp, and impersonation.
3. Carry one correlation ID from checkout through payment, entitlement, job, provider executions, Decision, report, and Admin recovery. Redact targets, credentials, and sensitive evidence from logs.
4. Define alerts and runbooks for payment backlog, job failure, provider degradation, entitlement mismatch, report contradiction, authentication anomalies, and elevated Admin use.
5. Define and test Content Security Policy, clickjacking controls, HSTS, referrer policy, permissions policy, CSRF controls, rate limits, dependency review, and secret redaction.
6. Rehearse backup, point-in-time recovery, restore verification, schema rollback, provider outage, credential rotation, payment reconciliation, and incident communication.
7. Complete external penetration testing, live Supabase RLS verification, accessibility review, browser and device coverage, legal and provider terms review, and PayPal production certification.
8. Establish release ownership, go or no-go review, rollback triggers, post-release monitoring, and evidence retention for each deployment.

### Deliverables

- CI and deployed journey matrix.
- End-to-end telemetry, dashboards, alerts, and support references.
- Security control specification and independent test results.
- Backup, restore, rollback, incident, and provider runbooks with rehearsal records.
- Beta and production evidence packs.

### Acceptance criteria

- The exact release commit passes the complete CI matrix and the deployed purchase-to-report journey.
- Security and isolation tests cover customer, cross-tenant, staff, Comp, and impersonation boundaries.
- On-call staff can trace a paid Investigation and recover each supported failure through documented, audited actions.
- Restore and rollback rehearsals meet approved recovery point and recovery time objectives.
- External certification findings are closed or explicitly accepted by an accountable owner before production.

**Estimate:** 18 to 30 engineering days, plus external review and certification time.

**Dependencies:** All workstreams. Hardening begins during Phase 0 and owns the final evidence gates.

## Estimate summary

| Workstream | Engineering effort | Main release contribution |
| --- | ---: | --- |
| A. Core platform | 18 to 28 days | One durable Investigation and Archive |
| B. Authentication | 12 to 18 days | Server session, authorization, and tenant isolation |
| C. Payment | 22 to 34 days | PayPal recovery, provider abstraction, asynchronous generation |
| D. Investigation Engine | 24 to 38 days | Governed evidence, providers, deduplication, and Decision |
| E. Executive Report | 16 to 25 days | Concise, consistent, evidence-backed deliverable |
| F. UX | 24 to 36 days | Canonical navigation and page-level quality |
| G. Admin | 18 to 28 days | Full audited operations, Comp, and impersonation |
| H. Performance | 12 to 20 days | Journey budgets, efficient reads, and load evidence |
| I. Production hardening | 18 to 30 days | Deployed security, recovery, and release proof |
| **Total planned effort** | **164 to 257 engineering days** | Excludes Stripe, CardCom, new providers, and external wait time |

The total is not an elapsed-time estimate. A staffed program can run approved tasks in parallel. A realistic schedule must reserve shared ownership for architecture, product, design, risk, security, data, operations, and quality review. Planning should also reserve contingency for migration findings, provider certification, and production-like testing.

## Dependency and staffing guidance

- Assign one accountable program owner and one technical owner for the Investigation aggregate.
- Keep Phase 0 small. Product, architecture, security, data, payments, investigation quality, report, UX, and operations must approve their respective contracts.
- Start B session repair and the C PayPal event design immediately after contract approval.
- Start A persistence migration before route consolidation. F can inventory and test current pages while A is in progress, but final wiring waits for canonical APIs.
- Start D corpus review before schema completion. Final deduplication and Decision work waits for canonical artifact identifiers.
- Start E editorial standards alongside D, then implement report composition after Decision precedence is fixed.
- Start I test planning and observability at Phase 0. Do not defer release evidence until the end.
- Add Stripe or CardCom only after provider-neutral PayPal settlement passes production certification. Their work must not delay recovery of the active PayPal journey.

## Beta exit gate

External beta is approved only when every item below has recorded evidence:

- [ ] P0-01 through P0-04 are closed with regression tests.
- [ ] One durable Investigation connects intake, payment, job, evidence, Decision, Executive Report, and Archive.
- [ ] Server sign-out, route protection, tenant isolation, report authorization, Admin, Comp, and impersonation boundaries pass adversarial tests.
- [ ] PayPal settlement is webhook-led, atomic, idempotent, reconciled, and independent of browser return.
- [ ] Investigation generation is asynchronous, resumable, and observable.
- [ ] Every canonical route uses one navigation shell, one data source, approved vocabulary, and complete customer states.
- [ ] Every generated golden report passes evidence lineage, semantic duplication, contradiction, usefulness, and editorial review.
- [ ] Provider coverage and limitations are visible and conclusions fail safely when evidence is insufficient.
- [ ] Accessibility, responsive, locale, RTL, browser, and performance acceptance pass for the core journey.
- [ ] Support can trace and recover the defined failure scenarios through audited tools.
- [ ] Checkout, delivery, export, retention, and payment-method copy matches verified behavior.

## Production exit gate

Production requires the beta gate plus:

- [ ] A successful production-equivalent migration rehearsal and reconciled record report.
- [ ] Live PayPal settlement, webhook, reconciliation, refund, dispute, and duplicate-event certification.
- [ ] Production provider source, legal, quota, retention, health, and outage review.
- [ ] Independent security assessment and live tenant-isolation verification.
- [ ] Backup, restore, rollback, credential-rotation, and incident-response rehearsals.
- [ ] Approved p95 journey performance and capacity headroom under production load.
- [ ] A successful first-customer acceptance walkthrough on the exact release commit.
- [ ] Named owners accept remaining risks, operating alerts, support coverage, and rollback triggers.

Stripe, CardCom, and any new intelligence provider receive their own enablement gate after initial production recovery. They are part of the architecture and roadmap now, but they are not dependencies for certifying PayPal as the first production payment method.

## Backlog governance

Every implementation item created from this roadmap must include:

- Workstream and audit finding references.
- User or operational outcome.
- Dependencies and migration impact.
- Security, privacy, authorization, and audit implications.
- Acceptance criteria and required automated and manual evidence.
- Rollout, monitoring, and rollback plan.
- Copy, localization, accessibility, and support impact where applicable.

A weekly recovery review should report completed exit criteria, new evidence, open risks, estimate changes, and blocked vendor or environment work. Progress is measured by closed acceptance criteria and demonstrated journeys, not by route count, test count, or feature volume.

## Decision

The production audit is approved and incorporated as the baseline. ShadowScore will execute one Production Recovery Roadmap across Workstreams A through I. The team will not begin unrelated feature development or treat the audit's P0 list as an isolated repair queue. Implementation starts only after the Phase 0 contracts and workstream owners are approved.

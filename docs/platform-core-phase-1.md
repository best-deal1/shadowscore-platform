# Platform Core Phase 1

## Confirmed previous architecture

The paid report path ran synchronously from `markPaymentPaidAndGenerateReport` into `buildReadyReport`. Provider planning, provider calls, Website Intelligence, decisions, report construction, scan history, and alerts completed inside that server request. The workspace report and payment state used the process-local workspace store. Supabase adapters persisted Website Intelligence scans, watchlists, and alerts when an authenticated Supabase session was available.

The previous `/api/investigations` routes used a seeded, process-local workflow repository. They did not execute the report pipeline, authenticate a workspace actor, enforce entitlements, or survive a deployment restart. Supabase already supplied organizations, active memberships, user-owned reports, Website Intelligence history, watchlists, alerts, product catalog entries, subscriptions, entitlement grants, and RLS. Phase 1 uses those tenant boundaries.

## Phase 1 design

`subjects` and `subject_identifiers` provide tenant-scoped canonical identity. Exact normalized domain identifiers resolve deterministically. Business and person names remain separate. Historical scans are linked non-destructively after a tenant-local subject backfill.

`investigation_jobs` is a Supabase-backed queue. The enqueue function resolves the subject and creates the job, stages, and audit records in one transaction. The claim function uses `FOR UPDATE SKIP LOCKED` and a lease. Expired leases are recoverable. Worker failures use bounded exponential backoff. Unique workspace and idempotency keys prevent duplicate jobs. Stage names mirror the current Website Intelligence and report pipeline.

The authenticated API returns `202` for a new job and `200` for an existing idempotent job. RLS protects job and stage reads. The server derives the user and workspace from the HttpOnly session and active organization membership. At least one active workspace entitlement is required before enqueueing.

The worker executes the existing Website Intelligence collector, appends a subject-linked scan, appends normalized evidence observations, records provider usage with unknown cost rather than invented prices, completes stages, and writes audit events. Evidence is immutable by policy. Freshness policy is evidence-specific: DNS and reputation 6 hours, HTTP status 1 hour, SSL and security headers 24 hours, and WHOIS 7 days. Evidence is stale for one additional TTL window, then expired.

Provider cache keys include visibility scope, tenant where private, provider, collector version, normalized target, request type, and stable parameters. Public reuse must be explicitly selected. The database cache is service-written and has no customer read policy in Phase 1.

## Deployment configuration

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a high-entropy `INVESTIGATION_WORKER_SECRET`. Optionally set `INVESTIGATION_WORKER_ID` to identify a deployment. Apply the Supabase migration before deploying the API.

Configure the deployment scheduler to send `POST /api/internal/investigation-worker` with `Authorization: Bearer <INVESTIGATION_WORKER_SECRET>`. Invoke it at least once per minute for prompt execution. The application does not claim background execution until this scheduler is configured.

## Known limitations and follow-up

Phase 1 queues authenticated workspace Website Intelligence. Guest Instant Report still uses its legacy synchronous path because a durable guest ownership and entitlement claim needs a separate migration. Paid report assembly also remains on the existing path. The durable worker produces the Website Intelligence scan and evidence record, but does not yet materialize the full paid canonical report or generate watchlist alerts. A follow-up should move paid intake references into job metadata, make each stage its own transaction, add a provider call checkpoint before external I/O, and route paid and guest report creation through the same worker.

The cost boundary supports fixed, quantity-based, and unknown costs. Actual provider rate configuration and billing reconciliation remain deployment concerns. Cache persistence is modeled, while collectors still need to adopt the cache boundary individually.

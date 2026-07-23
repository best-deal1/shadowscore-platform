# Epic 3: Investigation Workspace

## Status and implementation boundary

**Status:** Proposed technical design.  
**Delivery rule:** Epic 3 adds an authenticated, team-oriented workspace around the existing Trust Intelligence engines. It does not change the evidence, decision, or report-generation rules in this epic.

ShadowScore already collects source-backed evidence, produces a knowledge graph, evaluates an explainable decision, and exposes an investigation detail view. Epic 3 makes those outputs operational for analysts: a team can open a case, inspect evidence and relationships, assign work, record decisions, monitor material changes, and retain an auditable case record.

The workspace is a consumer of typed platform outputs. `lib/reportPipeline.ts` remains the server-side coordinator. Existing engines remain the owners of their domains. The workspace must never expose provider execution records, internal reasoning, credentials, or unapproved raw data to the browser.

## Vision and scope

### Vision

Provide one private place where an authorized team can investigate a business, see what the evidence supports, resolve outstanding work, and document a reviewable business decision.

### In scope

- A tenant-scoped case workspace for existing and new investigations.
- A durable evidence graph that connects canonical entities, relationships, evidence, findings, alerts, and decisions.
- Case workflow, ownership, tasks, comments, decision records, and immutable audit events.
- Monitoring subscriptions that create deduplicated alerts from approved signal changes.
- A chronological timeline that combines collection, analyst, monitoring, and decision events.
- An AI-generated investigation summary that is grounded in approved workspace data and requires human review before publication.
- Internal API contracts, authorization, pagination, filtering, and idempotency requirements.
- Responsive UI information architecture with accessible keyboard navigation and no dependence on a graph visualization for core work.

### Out of scope

- New third-party data providers, changes to provider execution, or changes to the Decision Engine policy.
- Replacing the existing report pipeline or public report presentation contract.
- External customer portals, public sharing links, or partner API access.
- Automated adverse-action decisions, autonomous outreach, or automatic case closure.
- Realtime multi-user document editing. Comments and assignments may refresh through polling in the first release.
- A generic organization administration product, billing redesign, or role-management UI beyond the minimum workspace roles.

## Goals and non-goals

| Goal | Measure of completion |
| --- | --- |
| Make active investigations actionable. | An analyst can create or open a case, inspect its evidence, complete a task, record a decision, and see the resulting audit events. |
| Preserve provenance. | Every displayed finding, graph edge, alert, and AI-summary claim links to immutable evidence references or a recorded analyst assertion. |
| Keep decisions explainable. | A decision record stores the selected outcome, rationale, evidence references, policy version, author, and timestamp. |
| Support safe monitoring. | Each alert identifies its changed signal, baseline and current observation, severity, deduplication key, and recommended review action. |
| Support teams without cross-tenant access. | Every query and mutation is scoped to the caller's organization and checked on the server. |

Non-goals are not hidden requirements. A missing signal remains `not_checked` or `unavailable`; it must not become negative evidence. AI output is assistive content, not evidence or a decision.

## Domain model

### Ownership and identifiers

Epic 3 introduces an `organization` boundary above existing user-owned records. New workspace records use UUID primary keys, `organization_id`, `created_at`, `updated_at`, and, where relevant, `created_by`. Existing `intakes`, `reports`, and `watchlist_entries` are migrated to an organization through an explicit backfill. During the transition, a personal organization is created for each existing profile.

Use UUIDs internally and opaque public IDs only in browser URLs. All timestamps are `timestamptz` in UTC. API timestamps use RFC 3339. User-provided text is stored as plain text and rendered escaped.

### Core entities

| Entity | Important fields | Rules |
| --- | --- | --- |
| Organization | `id`, `name`, `plan` | Isolation boundary for all workspace data. |
| Membership | `organization_id`, `user_id`, `role`, `status` | Roles are `owner`, `manager`, `analyst`, `viewer`. Disabled memberships cannot read data. |
| Case | `id`, `organization_id`, `investigation_id`, `title`, `status`, `priority`, `owner_id`, `due_at`, `version` | Operational wrapper around one investigation. `version` supports optimistic concurrency. |
| Investigation | Existing intake and report lifecycle data | Remains owned by `lib/investigation` and the report pipeline. A case links to one investigation. |
| Evidence item | `id`, `case_id`, `source_type`, `source_locator`, `observed_at`, `category`, `status`, `confidence`, `content_hash`, `payload` | Immutable after ingestion. Corrections create a superseding evidence item. |
| Graph entity | `id`, `case_id`, `entity_type`, `canonical_value`, `display_name`, `attributes` | Canonical values are normalized by entity type. |
| Graph relationship | `id`, `case_id`, `from_entity_id`, `to_entity_id`, `relationship_type`, `confidence`, `valid_from`, `valid_to` | Must have one or more supporting evidence links. |
| Finding | `id`, `case_id`, `kind`, `severity`, `state`, `statement`, `evidence_count` | A human or rule-created conclusion. It cannot exist without evidence references or an explicitly labeled analyst assertion. |
| Task | `id`, `case_id`, `title`, `status`, `assignee_id`, `due_at`, `evidence_refs` | Work item, not evidence. |
| Alert | `id`, `case_id`, `subscription_id`, `dedupe_key`, `severity`, `state`, `baseline`, `current`, `first_seen_at` | One open alert per dedupe key. |
| Decision record | `id`, `case_id`, `outcome`, `rationale`, `evidence_refs`, `policy_version`, `supersedes_id` | Append-only. A later decision supersedes, never edits, an earlier decision. |
| Timeline event | `id`, `case_id`, `occurred_at`, `event_type`, `actor_type`, `actor_id`, `payload` | Append-only audit and activity feed. |

### Enumerations and invariants

```text
case.status:       draft | active | awaiting_input | under_review | monitoring | closed | archived
case.priority:     low | normal | high | critical
task.status:       open | in_progress | blocked | completed | cancelled
alert.state:       open | acknowledged | resolved | suppressed
finding.kind:      positive | risk | contradiction | gap | analyst_note
decision.outcome:  pass | proceed_with_verification | review | fail | no_decision
```

1. A case belongs to exactly one organization and one investigation.
2. Evidence is append-only. Retraction uses `superseded_by` and records a timeline event.
3. Every relationship and non-note finding has at least one `evidence_link`.
4. A `risk` finding requires a confirmed-risk classification from existing policy or an analyst assertion with author and rationale.
5. Closing a case requires an active decision record or a documented `no_decision` reason.
6. An archived case is read-only except for legal retention actions performed by an owner.
7. `organization_id` is included in every unique index and row-level-security predicate.

## Investigation workflow

### State flow

```text
draft -> active -> awaiting_input -> active -> under_review -> closed
                                           |                |
                                           v                v
                                      monitoring <------ reopened
```

1. **Create or link:** An analyst creates a case from an existing investigation or starts an intake. The service assigns the creator as owner and writes `case.created`.
2. **Collect:** Existing payment-gated collection and report generation run unchanged. Normalized outputs are projected into workspace evidence, entities, relationships, and timeline events after the report is ready.
3. **Triage:** The owner sets priority, assignee, due date, and checklist tasks. The workspace identifies evidence gaps and open alerts.
4. **Investigate:** Analysts filter evidence, inspect graph paths, create evidence-backed findings, and document external verification as an analyst assertion.
5. **Review:** A manager reviews unresolved gaps, risk findings, and proposed decision. The decision view compares the proposal with the current canonical decision without mutating it.
6. **Decide:** An authorized analyst or manager records a decision. The record is immutable and sets the case to `closed` or `monitoring`.
7. **Monitor or reopen:** A material signal change creates an alert. A user acknowledges it, creates work, and reopens the case when needed.

### Transition authorization

| Action | Roles | Preconditions |
| --- | --- | --- |
| Create, assign, change priority | owner, manager, analyst | Active membership. |
| Move to `under_review` | owner, manager, analyst | Investigation is ready, or the case contains a documented manual-review basis. |
| Record decision, close, start monitoring | owner, manager, analyst | Rationale is present. `pass` and `fail` require at least one evidence reference. |
| Archive, manage members, suppress alert rules | owner, manager | Suppression requires a reason and expiry. |
| Read, comment, export approved summary | viewer and above | Active membership. |

All mutations require an idempotency key. Case updates also require the current `version`; a stale request returns `409 case_version_conflict` with the current resource representation.

## Workspace architecture

### Bounded contexts and ownership

| Context | Owns | Existing dependency |
| --- | --- | --- |
| Investigation | Intake, collection lifecycle, report versions | `lib/investigation`, `lib/reportPipeline.ts` |
| Evidence | Normalized immutable evidence and provenance | `lib/evidence` |
| Graph | Entity resolution and evidence-backed relationships | `lib/knowledgeGraph`, `lib/graph` |
| Decision | Canonical decision evaluation and policy | `lib/decisionEngine`, `lib/canonicalDecision.ts` |
| Monitoring | Snapshots, change detection, subscriptions, alerts | `lib/monitoringEngine`, `lib/trustWatch` |
| Workspace | Cases, tasks, collaboration, summary requests, audit | New server-only `lib/workspace` boundary |

Create `lib/workspace` as server-only modules. Route handlers authenticate, validate input, call a workspace service, and serialize browser-safe DTOs. Services coordinate repositories and domain engines. Repositories are the only code that accesses Supabase tables. Client Components call route handlers and never import server services, providers, or raw report data.

### Data projection and consistency

The existing report pipeline emits `investigation.ready` only after storing a ready report. A workspace projector consumes that event idempotently using `(organization_id, source_event_id)` as a unique key. It writes immutable evidence records, graph projections, and a `report.ready` timeline event in one transaction where possible. A failed projection is retried with exponential backoff and is visible to operators.

The first implementation may invoke the projector synchronously after a successful report write if no queue exists. It must still persist an outbox event first, so a retry is possible. Monitoring evaluations write snapshots before evaluating rules. An alert and its timeline event are written atomically.

### Storage plan

Add a forward-only Supabase migration with tables: `organizations`, `organization_memberships`, `cases`, `case_tasks`, `case_comments`, `case_evidence`, `graph_entities`, `graph_relationships`, `evidence_links`, `monitoring_subscriptions`, `monitoring_snapshots`, `monitoring_alerts`, `decision_records`, `ai_summary_versions`, `timeline_events`, `workspace_outbox`, and `idempotency_keys`.

Use JSONB only for versioned, source-specific payloads and event metadata. Put fields used for filtering in typed columns. Required indexes include:

- `cases (organization_id, status, updated_at desc)` and `(organization_id, owner_id, status)`.
- `case_evidence (case_id, observed_at desc)`, `(case_id, category, status)`, and unique `(case_id, content_hash)`.
- `graph_entities (case_id, entity_type, canonical_value)` unique.
- `graph_relationships (case_id, from_entity_id, to_entity_id, relationship_type)`.
- `monitoring_alerts (organization_id, state, severity, last_seen_at desc)` and unique partial index for open dedupe keys.
- `timeline_events (case_id, occurred_at desc, id desc)` for cursor pagination.

Enable RLS for every new table. Policies must join membership on `organization_id` and use `auth.uid()`. Service-role jobs bypass RLS only in server-only workers and must supply an organization context.

## Evidence Graph architecture

### Graph model

The Evidence Graph is a case-scoped property graph. Nodes represent business entities, evidence, findings, alerts, and decisions. Edges express typed, time-bound claims and always retain support links. The graph is a projection for investigation and query. It is not a second provider store.

Initial entity types: `business`, `person`, `domain`, `email`, `phone`, `address`, `payment_account`, `marketplace_account`, `registry_record`, `website`, `evidence`, `finding`, `alert`, and `decision`.

Initial relationship types: `owns`, `operates`, `registered_at`, `uses`, `controls`, `associated_with`, `same_as`, `contradicts`, `supported_by`, `observed_in`, and `triggered`.

Each edge stores a direction, `confidence` from 0 to 100, `assertion_kind` (`provider`, `derived`, `analyst`), valid-time interval, and one or more `evidence_links`. Derived edges must store the derivation version. Analyst edges must store author and rationale. The UI labels assertion kind and confidence; it does not present inferred links as verified facts.

### Ingestion and resolution

1. Convert approved `EvidenceItem` and knowledge-graph outputs into `case_evidence` records.
2. Normalize candidate entity values by type. Examples: lowercase domains and emails, E.164 phones where parseable, and normalized addresses with original display text retained.
3. Upsert entities by `(case_id, entity_type, canonical_value)`. Cross-case identity resolution is deferred until organization-wide consent, retention, and false-match controls are designed.
4. Upsert relationships only when source output supplies them or a documented derivation rule creates them.
5. Attach evidence links. Reject graph writes that leave required support absent.

### Query behavior

`GET /api/cases/{caseId}/graph` accepts `focus`, `depth` from 1 to 3, entity types, and a max node count of 250. The server returns a bounded subgraph plus `truncated: true` when it reaches the limit. It returns an evidence count and a compact provenance preview on each node and edge. Full source details are loaded from the evidence endpoint after authorization.

Graph layout is client-side and disposable. Selection state uses stable IDs. A list view provides the same relationships for keyboard and screen-reader users.

## Monitoring and Alerts architecture

### Subscription model

A monitoring subscription attaches to a case and targets one or more canonical entities. It contains `schedule`, `signal_types`, `thresholds`, `state`, `last_evaluated_at`, and a versioned rule configuration. Initial schedules are daily and weekly. Evaluation is server-side and uses approved provider and engine capabilities only.

Each evaluation persists an immutable snapshot of observed signals with provider version, observed time, and content hash. Change detection compares the latest usable baseline with the new snapshot. It classifies changes as `new`, `removed`, `changed`, `unavailable`, or `not_checked`. Unavailable and not-checked states are operational information, not risk evidence.

### Alert lifecycle and severity

| Severity | Trigger examples | Default handling |
| --- | --- | --- |
| Critical | Confirmed blocking risk or a policy-defined material identity contradiction. | Create open alert and task. Notify owner and managers. |
| High | Material ownership, registry, payment, or domain-control change. | Create open alert. Notify owner. |
| Medium | Meaningful signal drift or new evidence requiring review. | Create open alert in workspace. |
| Low | Non-material informational change. | Add to timeline and notification digest. |

The dedupe key is `subscription_id + signal_type + normalized_subject + change_fingerprint`. Repeated observations update `last_seen_at` and count rather than create more open alerts. A resolved alert can reopen only if its fingerprint changes after resolution. Suppression requires a reason, actor, and expiration. It never deletes the alert.

Notification delivery starts with in-app notifications and optional email. Delivery failures are recorded separately and do not alter alert state. Webhooks, Slack, and paging integrations are future work.

## Case management

### Case record

The case header shows title, target identity, current status, priority, owner, due date, current decision, evidence coverage, and open alert count. Case metadata is separate from source evidence and records its own timeline events.

Tasks support title, description, assignee, due date, status, and evidence references. Comments support mentions, plain-text body, and optional evidence or graph links. Editing a comment creates a revision record. Deletion is a soft delete that retains author and timestamp in the audit trail.

### Decision records

Decision records use the existing canonical outcomes: `pass`, `proceed_with_verification`, `review`, and `fail`. A `no_decision` record is only for closure without a business recommendation. The decision form requires a rationale, selected evidence, and confirmation that the reviewer has considered unresolved gaps. It displays the current engine recommendation as read-only context and identifies its engine and policy versions.

Recording a decision creates: the decision record, decision graph node and supported-by links, a timeline event, and a case state change in one transaction. Exported summaries include the latest decision only, with a link to decision history for authorized users.

## Timeline

The timeline is the chronological audit surface, not an editable note stream. It includes intake, report, evidence, relationship, finding, task, comment, alert, subscription, AI-summary, decision, state-transition, and access-sensitive export events.

Each event stores `occurred_at`, `recorded_at`, `actor_type` (`user`, `system`, `provider`), actor identifier where available, event type, a safe display payload, and reference IDs. The UI orders events by `(occurred_at desc, id desc)`, groups them by UTC date, filters by category, and cursor-paginates. Backdated analyst assertions display both when the fact was observed and when it was recorded.

Audit events are append-only. Corrections create a new event that references the original. Retention and legal hold rules are enforced server-side; the product UI does not offer irreversible audit deletion.

## AI Investigation Summary

### Purpose and guardrails

The AI summary converts approved case data into a concise review aid. It may summarize, organize, and call out conflicts. It must not discover evidence, state unsupported facts, calculate a new risk score, or replace the Decision Engine or reviewer.

Inputs are a server-generated, tenant-authorized summary packet: current identity, latest decision, selected findings, evidence titles and excerpts, evidence references, unresolved gaps, alert summaries, and timeline milestones. Raw provider execution logs, secrets, internal reasoning, and data outside the case are excluded.

The generation prompt requires every factual sentence to cite one or more supplied reference IDs. The service validates that all citations exist in the packet, rejects uncited factual claims, and stores the model name, prompt-template version, input packet hash, output, citations, and validation result in `ai_summary_versions`.

### Review flow

1. An analyst requests a draft using `POST /api/cases/{caseId}/ai-summary`.
2. The server enqueues or performs generation, validates citations, and stores a `draft` version.
3. The analyst reviews the draft beside its cited evidence, edits plain text if needed, and marks it `approved`.
4. Only an approved version may be exported or shared within the organization. Approval creates an audit event.

If generation fails or citations do not validate, return a clear error and preserve no partial draft as approved content. Display a factual disclaimer: “Draft summary. Review cited evidence before relying on it.”

## Team collaboration

### Roles and capabilities

| Capability | Owner | Manager | Analyst | Viewer |
| --- | --- | --- | --- | --- |
| Read cases, evidence, graph, timeline | Yes | Yes | Yes | Yes |
| Comment and create tasks | Yes | Yes | Yes | No |
| Update case and resolve alerts | Yes | Yes | Yes | No |
| Record decisions | Yes | Yes | Yes | No |
| Manage members and archive | Yes | Yes | No | No |
| Manage organization settings | Yes | No | No | No |

The first release uses request-response updates plus 30-second polling for active case activity. Every mutation returns the updated resource, current version, and timeline event ID. Conflict responses preserve the user's unsaved form data on the client and offer reload or compare actions. Realtime subscriptions are a later optimization, not a correctness dependency.

Mentions resolve only active members in the same organization. Notifications contain case title and event metadata only. Evidence values and AI content remain behind authenticated links.

## API endpoints

All endpoints require an authenticated session, organization membership, JSON request bodies, and `application/json` responses. List endpoints use opaque cursor pagination with a default page size of 25 and maximum of 100. Mutation endpoints require `Idempotency-Key`. Errors use `{ "error": { "code", "message", "requestId", "details?" } }`.

| Method and path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/cases` | List cases | Filters: status, owner, priority, alert state, query. |
| `POST /api/cases` | Create a case | Links an existing investigation or creates a draft wrapper. |
| `GET /api/cases/{caseId}` | Read header and workspace summary | Browser-safe DTO only. |
| `PATCH /api/cases/{caseId}` | Update operational fields | Requires `version`; no evidence mutation. |
| `POST /api/cases/{caseId}/transitions` | Change state | Validates transition and reason. |
| `GET /api/cases/{caseId}/evidence` | List evidence | Filters category, status, source, observed date. |
| `GET /api/cases/{caseId}/evidence/{evidenceId}` | Read evidence and provenance | Includes supersession status. |
| `GET /api/cases/{caseId}/graph` | Read bounded graph subgraph | `focus`, `depth`, filters, node limit. |
| `GET /api/cases/{caseId}/findings` | List findings | Includes evidence reference counts. |
| `POST /api/cases/{caseId}/findings` | Create analyst finding | Requires evidence IDs or `analyst_note`. |
| `GET, POST /api/cases/{caseId}/tasks` | List or create tasks | POST assigns current user by default. |
| `PATCH /api/cases/{caseId}/tasks/{taskId}` | Update task | Uses task version. |
| `GET, POST /api/cases/{caseId}/comments` | List or create comments | Plain text and references only. |
| `GET /api/cases/{caseId}/timeline` | Read chronological activity | Cursor pagination and category filter. |
| `POST /api/cases/{caseId}/decisions` | Record immutable decision | Requires outcome, rationale, evidence IDs. |
| `GET /api/cases/{caseId}/decisions` | Read decision history | Latest decision first. |
| `GET, POST /api/cases/{caseId}/monitoring-subscriptions` | Read or create monitoring | POST validates supported signals. |
| `PATCH /api/cases/{caseId}/monitoring-subscriptions/{id}` | Pause, resume, or update rule | Changes are versioned. |
| `GET /api/alerts` | List organization alerts | Filters state, severity, assignee, case. |
| `POST /api/alerts/{alertId}/actions` | Acknowledge, resolve, suppress | Requires action and reason where applicable. |
| `POST /api/cases/{caseId}/ai-summary` | Create summary draft | Rate-limited, citation validated. |
| `GET /api/cases/{caseId}/ai-summaries` | Read summary versions | Approved content is distinct from drafts. |
| `POST /api/cases/{caseId}/ai-summaries/{id}/approve` | Approve reviewed summary | Analyst or above. |

Existing investigation and entity endpoints remain compatible during migration. New workspace UI reads only the new case endpoints once a case exists. Add contract tests for authorization, pagination, validation, idempotency, and browser-safe serialization.

## UI structure

### Routes

```text
/workspace                         Case queue
/workspace/cases/[caseId]          Case overview
/workspace/cases/[caseId]/evidence Evidence table and detail drawer
/workspace/cases/[caseId]/graph    Graph and accessible relationship list
/workspace/cases/[caseId]/timeline Activity and audit timeline
/workspace/cases/[caseId]/decision Decision history and record form
/workspace/cases/[caseId]/monitoring Subscriptions and alerts
/workspace/cases/[caseId]/summary  AI summary versions and review
/alerts                            Organization alert queue
```

### Case layout

The desktop layout has a persistent case header, a primary tab bar, a main content column, and a right context rail. The rail shows owner, due date, open tasks, open alerts, current decision, and related actions. On narrow screens, the rail appears below content and tabs become horizontally scrollable. URL query parameters retain filters and selected evidence IDs so analysts can share internal links.

| Surface | Main content | Required states |
| --- | --- | --- |
| Case queue | Filters, sortable table, saved views, alert badges | Loading, empty, no-results, access denied. |
| Overview | Decision snapshot, evidence coverage, findings, task list, recent activity | No report yet, collection failed, stale data. |
| Evidence | Filterable table and provenance drawer | Evidence unavailable, superseded evidence. |
| Graph | Focused subgraph plus relationship list | Truncated graph, no relationships. |
| Timeline | Filtered audit events | Empty timeline only for draft case. |
| Monitoring | Subscriptions, alert list, change comparison | Paused, provider unavailable, no baseline. |
| Summary | Draft and approved versions with citation panel | Generation pending, invalid draft, no approved summary. |

All actions have visible labels, keyboard operation, focus restoration after dialogs, and status announcements. Color is never the sole indication of risk or alert severity. Copy identifies observations, gaps, and analyst assertions precisely.

## Milestones

| Milestone | Deliverables | Exit criteria |
| --- | --- | --- |
| M0: Foundation | Organization migration, memberships, RLS, case schema, audit and idempotency primitives. | Existing users are backfilled into personal organizations. RLS and authorization tests pass. |
| M1: Case workspace | Case queue, case header, state transitions, tasks, comments, timeline, case API. | An analyst can manage an investigation through review with a complete audit trail. |
| M2: Evidence Graph | Evidence projection, entity and relationship tables, graph API, evidence UI, accessible list. | Every displayed graph relationship resolves to evidence links. |
| M3: Monitoring | Snapshots, subscriptions, rule evaluation, alert queue, notification delivery. | A fixture signal change produces one deduplicated, reviewable alert. |
| M4: Decisions and summaries | Immutable decision records, AI draft validation, approval, export guardrails. | Approved summary claims all cite case evidence and decision history remains immutable. |
| M5: Hardening | Load tests, observability, retention jobs, migration rollout, accessibility and security review. | Acceptance criteria pass in staging and rollback procedure is rehearsed. |

## Acceptance criteria

### Functional

- A member can create, view, filter, assign, and transition only cases in their organization.
- A ready investigation projects evidence and a timeline event exactly once even when its source event is delivered twice.
- Evidence detail exposes source, observed time, category, status, confidence, and supersession state.
- Every graph edge returned by the API has at least one authorized evidence link, or is clearly marked as an analyst assertion with author and rationale.
- A monitored fixture change creates a snapshot, one deduplicated alert, and one timeline event. A repeat of the same change updates that alert rather than creating another open alert.
- A recorded decision cannot be edited. A replacement decision points to the record it supersedes.
- AI drafts with an unknown or missing citation cannot be approved or exported.

### Security and quality

- Cross-organization reads and writes return `404` for resource IDs outside the caller's organization.
- RLS tests cover every workspace table and every role.
- All mutation endpoints honor repeated idempotency keys without duplicate side effects.
- Workspace DTO tests confirm that raw provider results, internal reasoning, credentials, and unapproved AI drafts are absent from browser responses.
- Cursor pagination is stable when new timeline events arrive between pages.
- Core queue, case overview, evidence table, and decision form meet the repository accessibility validation and have keyboard-flow coverage.
- Observability records request ID, organization ID, case ID where applicable, actor type, event type, duration, and safe error code. Logs do not contain evidence payloads or secrets.

## Risks and dependencies

| Risk or dependency | Impact | Mitigation |
| --- | --- | --- |
| Existing data is user-scoped, not organization-scoped. | Incorrect migration could expose data. | Use a personal-organization backfill, dual-read only during migration, RLS tests, and a rollback plan. |
| In-memory investigation repository is not durable. | Cases could link to records that disappear after restart. | Make durable investigation and report persistence a prerequisite for production workspace rollout. |
| Provider data has uneven availability and provenance. | False confidence or noisy alerts. | Preserve `unavailable` and `not_checked`, require evidence links, and show source freshness. |
| Graph resolution can create false matches. | Analysts may infer incorrect relationships. | Scope resolution to a case initially, normalize conservatively, preserve assertion kind, and require evidence-backed links. |
| Monitoring evaluation can be costly or rate-limited. | Delayed or incomplete alerts. | Schedule by plan, batch targets, track provider availability, and use retries with backoff. |
| AI summaries can hallucinate or leak data. | Unsafe decision support or data exposure. | Use scoped packets, citation validation, human approval, audit records, and no training-data retention assumptions. |
| Concurrent analyst updates cause lost work. | Confusing case state or assignments. | Optimistic concurrency, idempotency keys, append-only events, and conflict UX. |
| Retention and privacy requirements are not finalized. | Data cannot be safely deleted or retained. | Define organization retention settings and legal-hold policy before general availability. |

Required dependencies: authenticated Supabase sessions, durable organization-aware persistence, existing evidence and decision contracts, a server-side job runner or retryable outbox worker, email delivery configuration for notifications, and an approved AI provider with data-processing terms.

## Future roadmap

1. Add organization-wide entity resolution with consent, match-review queues, and false-positive controls.
2. Add real-time collaboration, presence, and notification integrations after the polling workflow is proven.
3. Add configurable monitoring rules, webhooks, Slack, and ticketing integrations.
4. Add evidence attachments with malware scanning, retention controls, and redaction workflows.
5. Add review templates, approval chains, and policy packs by use case.
6. Expose a versioned partner API only after tenant isolation, export controls, and audit requirements are validated internally.
7. Add analytics for case cycle time, alert quality, decision reversals, and evidence coverage without using analytics as a decision signal.

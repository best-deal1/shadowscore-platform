# Platform Core Phase 2: Entity Intelligence architecture blueprint

Status: proposed  
Audience: product, platform, data, security, compliance, and collector teams  
Decision horizon: ten years  
Scope: architectural foundation and migration plan only

## 1. Executive decision

ShadowScore will use **Subject** as the stable investigation aggregate for any digital or legal entity. A subject is not a claim that an entity exists. It is the tenant-scoped object under investigation. Identifiers, observations, relationships, decisions, and monitoring state attach to that object with provenance and time boundaries.

Website Intelligence becomes a collector package registered against domain and website subjects. It keeps its current API and report behavior during migration. The platform core will not contain website-specific stage names, evidence rules, or provider logic.

Phase 2 establishes six boundaries:

1. **Identity boundary:** subjects and identifiers, including cautious resolution and merge history.
2. **Collection boundary:** versioned collector manifests, contracts, policies, and executions.
3. **Evidence boundary:** immutable source records, raw observations, normalized assertions, and supersession.
4. **Relationship boundary:** temporal, evidence-backed relationship assertions. This is not Trust Graph.
5. **Policy boundary:** purpose, jurisdiction, consent, sensitivity, retention, access, and audit checks.
6. **Consumption boundary:** stable read models for decisions, monitoring, APIs, and future AI systems.

The source record and raw evidence are append-only. Derived views can be rebuilt. No score, AI output, or collector response becomes fact merely because the platform stored it.

## 2. Goals and boundaries

### Goals

- Represent any current or future subject type without a schema rewrite.
- Add collectors through a registry and contract, not edits to the orchestrator.
- Preserve provenance, policy context, and temporal meaning for every assertion.
- Separate observed values from identity resolution, relationships, decisions, and presentation.
- Enforce tenant, purpose, jurisdiction, and sensitivity controls before collection and before use.
- Support reproducible decisions and monitoring from immutable inputs.
- Let future AI consume bounded, cited, policy-filtered context.
- Preserve the existing Website Intelligence routes, reports, scans, and clients while migration proceeds.

### Explicit exclusions

- No new collector or intelligence module is part of Phase 2 foundation work.
- Trust Graph is deferred. The relationship ledger defined here is neutral platform data, not a trust score or graph product.
- Automatic person matching, biometric matching, household inference, and regulated identifier acquisition are excluded.
- The blueprint does not authorize collection. Availability in the type system does not establish a lawful purpose.

## 3. Core principles

1. **Stable identity, flexible classification.** A UUID identifies a subject. A versioned type key classifies it.
2. **Tenant isolation by construction.** Private subjects and all dependent records carry a workspace boundary. Cross-tenant reuse requires an explicit public data policy.
3. **Identifiers are claims.** An identifier can be unavailable, prohibited, unverified, disputed, revoked, or tokenized.
4. **Observations are immutable.** Corrections append a new record and point to the record they supersede.
5. **Provenance is mandatory.** A normalized assertion must trace to observations, a source, an execution, a normalizer version, and a policy decision.
6. **Policy checks deny by default.** Collection, storage, use, export, monitoring, and AI access are separate actions.
7. **Collectors declare capabilities.** The orchestrator selects compatible collectors from manifests and policy, rather than hard-coded subject cases.
8. **Confidence is decomposed.** Reliability, extraction quality, corroboration, freshness, and conflict are visible inputs.
9. **Derived data is reproducible.** Decision, relationship, monitoring, and AI outputs record input sets and versioned logic.
10. **Evolution uses additive versions.** Type definitions, taxonomies, contracts, and read APIs are versioned. Stored historical meanings do not change in place.

## 4. Shared language

| Term | Meaning |
| --- | --- |
| Subject | The stable, tenant-scoped investigation aggregate. |
| Subject type | A versioned classification such as `digital.domain` or `legal.organization`. |
| Identifier | A typed claim that can locate or distinguish a subject. |
| Source | The origin responsible for information, such as a registry, document, provider, or direct observation. |
| Collector | A package that acquires observations for declared subject and identifier types. |
| Observation | An immutable record of what a collector received or directly measured. |
| Assertion | A normalized, typed proposition derived from one or more observations. |
| Relationship assertion | A temporal proposition connecting two subjects. |
| Investigation | The user-visible unit of requested work. |
| Execution | One attempt to run one collector within an investigation. |
| Decision | A versioned policy evaluation over an immutable evidence set. |
| Monitor | A policy-approved schedule and baseline for detecting changes. |

## 5. Entity and identifier model

### 5.1 Subject

The canonical `Subject` contract is:

```ts
interface Subject {
  subjectId: string;
  workspaceId: string | null;
  subjectTypeKey: string;
  typeDefinitionVersion: number;
  displayName: string;
  lifecycleStatus: "active" | "merged" | "archived";
  visibility: "workspace" | "public";
  mergedIntoSubjectId: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
```

`subjectId` never encodes type or identifier. Type changes are audited revisions. A merge redirects one subject to another but preserves all old references. An unmerge is a reviewed correction that appends a new resolution decision. Deletion requests use policy-controlled erasure or tombstoning, rather than breaking audit history.

Subject types live in `subject_type_definitions`, not a database enum. Initial definitions can include:

- `digital.domain`, `digital.website`, `digital.email`, `digital.phone`, `digital.ip_address`, `digital.wallet`, `digital.payment_account`, `digital.social_profile`, `digital.ai_agent`, and `digital.device`
- `legal.business`, `legal.legal_entity`, `legal.sole_proprietor`, and `legal.organization`
- `commerce.marketplace_seller`, `commerce.amazon_seller`, `commerce.ebay_seller`, `commerce.etsy_shop`, and `commerce.shopify_store`
- `natural.person`, gated by jurisdiction and purpose policy

Each type definition declares a parent type, JSON Schema for optional attributes, allowed identifier type keys, permitted relationship predicates, default sensitivity, status, and semantic version. Adding a type is a controlled registry change. It does not require altering the `subjects` table.

The current `subject_type` values remain accepted through compatibility mapping. For example, `domain` maps to `digital.domain` and `marketplace_account` maps to `commerce.marketplace_seller`.

### 5.2 Identifier

Identifiers are independent, temporal claims:

```ts
interface SubjectIdentifier {
  identifierId: string;
  subjectId: string;
  identifierTypeKey: string;
  scheme: string;
  displayValue: string | null;
  normalizedValueCiphertext: string | null;
  lookupToken: string | null;
  valueAvailability: "present" | "not_collected" | "redacted" | "erased";
  verificationStatus: "unverified" | "verified" | "disputed" | "revoked";
  sensitivity: SensitivityClass;
  lawfulBasisRef: string | null;
  validFrom: string | null;
  validTo: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}
```

An identifier type definition owns normalization, validation, display masking, deterministic matching permission, sensitivity, retention, applicable jurisdictions, and whether encryption and keyed lookup tokens are required. Normalizers are pure, versioned functions. A normalization change appends an identifier representation with the new version.

Regulated identifiers are capabilities, not required fields. The model supports four safe states: absent, collected and encrypted, redacted, and erased. Search uses a tenant and type scoped HMAC token where policy permits deterministic lookup. Plaintext sensitive values never appear in logs, cache keys, event payloads, or URLs. Collectors receive an ephemeral decrypted value only after an access decision. A subject can remain useful with no regulated identifier.

### 5.3 Identity resolution

Resolution produces `identity_resolution_decisions` with candidate subjects, rules or model version, feature references, confidence, reviewer state, and policy context.

- Exact domain normalization can auto-link within one workspace.
- Names, people, devices, payment accounts, and marketplace identities do not auto-merge by default.
- Conflicting verified identifiers block automatic merge.
- Public and private subject records do not merge implicitly.
- Merge thresholds are type-specific and versioned.
- Every automatic merge supports review, dispute, and correction.

Identity confidence describes whether records refer to the same subject. It is distinct from evidence confidence and relationship confidence.

## 6. Collector framework

### 6.1 Registry

The Collector Registry contains immutable versions of manifests. Registration validates schemas, compatibility, policy declarations, and ownership. Activation is a separate administrative action.

```ts
interface CollectorManifest {
  collectorKey: string;
  version: string;
  contractVersion: "2.0";
  owner: string;
  runtime: "in_process" | "worker" | "remote";
  supportedSubjectTypes: string[];
  requiredIdentifierTypes: string[];
  optionalIdentifierTypes: string[];
  outputObservationTypes: string[];
  requiredPurposes: string[];
  supportedJurisdictions: string[];
  maximumInputSensitivity: SensitivityClass;
  sourceKinds: string[];
  freshnessPolicyKey: string;
  timeoutMs: number;
  retryPolicyKey: string;
  concurrencyKey: string;
  rateLimitKey: string;
  costPolicyKey: string;
  cachePolicyKey: string;
  dataResidency: string[];
  supportsMonitoring: boolean;
  idempotencyScope: string;
  inputSchemaRef: string;
  outputSchemaRef: string;
}
```

Registry states are `draft`, `validated`, `active`, `deprecated`, `disabled`, and `retired`. New work uses active versions. In-flight work pins its version. Disabled versions cannot start. Retired manifests remain readable for historical replay.

Website Intelligence registers as one manifest with its existing domain inputs and module outputs. Registration does not change its collector implementation.

### 6.2 Collector contract

```ts
interface CollectorV2 {
  describe(): CollectorManifest;
  validate(request: CollectorRequest): Promise<ValidationResult>;
  collect(request: CollectorRequest, context: CollectorContext): Promise<CollectorResult>;
  cancel?(executionId: string): Promise<void>;
  health?(): Promise<CollectorHealth>;
}

interface CollectorRequest {
  executionId: string;
  investigationId: string;
  subject: SubjectEnvelope;
  identifiers: AuthorizedIdentifierView[];
  purpose: string;
  jurisdiction: string;
  requestedObservationTypes: string[];
  deadline: string;
  idempotencyKey: string;
}

type CollectorEvent =
  | { type: "observation"; observation: RawObservationEnvelope }
  | { type: "checkpoint"; token: string; progress: number }
  | { type: "usage"; usage: ProviderUsage }
  | { type: "warning"; code: string; safeMessage: string };

interface CollectorResult {
  status: "succeeded" | "partial" | "failed" | "cancelled";
  events: AsyncIterable<CollectorEvent>;
  safeFailure?: { code: string; message: string; retryable: boolean };
}
```

The context supplies a scoped secret broker, source recorder, payload store, cache, telemetry, clock, abort signal, and event writer. Collectors cannot write canonical evidence or subject tables. They emit schema-validated observations. Provider credentials and sensitive identifiers are capability-scoped and short-lived.

### 6.3 Lifecycle

1. Author a manifest and schemas.
2. Validate contract, policy declarations, fixtures, timeout, cancellation, and redaction.
3. Register an immutable version.
4. Approve and activate it for selected workspaces or a percentage rollout.
5. Plan executions against the pinned version.
6. Run with leases, idempotency, rate limits, heartbeats, and checkpoints.
7. Record partial results and safe failure categories.
8. Observe quality, latency, cost, policy denials, and schema drift.
9. Deprecate with a replacement and end date.
10. Disable for incidents, then retire after retention obligations end.

Retries reuse the execution idempotency scope and never duplicate an accepted observation. A dead-letter state requires operator action. Cancellation stops future calls and retains already accepted evidence with its provenance.

## 7. Source, evidence, and normalization

### 7.1 Source Registry

`sources` identifies the responsible origin. `source_instances` identifies an endpoint, registry, document, account, dataset release, or direct measurement context. A provider is a transport and may expose several sources. A collector is software and may use several providers. These concepts remain separate.

A source includes owner, source kind, jurisdiction, access method, terms reference, licensing restrictions, data residency, update cadence, authentication class, allowed purposes, and lifecycle status. A source instance adds retrieval URI or opaque locator, publication time, effective time, checksum, and chain of custody.

### 7.2 Source reliability

Reliability is a versioned assessment by evidence taxonomy and jurisdiction, not a permanent global reputation score:

```ts
interface SourceReliabilityAssessment {
  sourceId: string;
  taxonomyNodeKey: string;
  jurisdiction: string | null;
  score: number;
  basis: "measured" | "reviewed" | "contractual" | "unknown";
  sampleSize: number | null;
  dimensions: {
    authority: number;
    accuracy: number;
    timeliness: number;
    transparency: number;
    independence: number;
  };
  validFrom: string;
  validTo: string | null;
  policyVersion: string;
}
```

Unknown reliability stays unknown. It is never converted to zero or an invented default. Historical assertions retain the reliability assessment used at evaluation time.

### 7.3 Evidence Registry and taxonomy

The Evidence Registry versions taxonomy nodes and JSON Schemas. A stable taxonomy key has a versioned meaning, value type, unit, applicable subject types, allowed sources, default freshness, sensitivity floor, contradiction group, and normalization profile.

Top-level taxonomy namespaces are:

- `identity`: names, identifiers, existence, and identity resolution features
- `registration`: legal, domain, account, and licensing registration facts
- `ownership_control`: declared, observed, and inferred control facts
- `presence`: web, marketplace, social, network, and physical presence facts
- `technical`: DNS, transport, hosting, device, and software observations
- `security`: certificate, configuration, compromise, and abuse observations
- `commerce`: storefront, seller, transaction capability, and payment observations
- `reputation`: third-party ratings, sanctions, complaints, and abuse reports
- `behavior`: observed actions and temporal patterns
- `relationship`: evidence used to support links between subjects
- `compliance`: consent, licensing, regulatory, and policy observations
- `provenance`: chain of custody and source metadata

Taxonomy is descriptive. A node does not imply risk or trust. Decision policies interpret assertions separately.

### 7.4 Three evidence layers

1. **Raw payload:** encrypted object storage, checksum, strict access, retention, and legal hold. It may be absent when storage is prohibited.
2. **Observation:** immutable record of what the source returned, with source, collector execution, observed and effective times, schema, sensitivity, and payload reference.
3. **Assertion:** normalized proposition with subject, predicate, typed value, qualifiers, evidence links, validity interval, confidence components, and status.

The platform never overwrites an assertion to match a later observation. `supersedesAssertionId`, `retractedAt`, and validity intervals express change. A current-state projection chooses the applicable assertion at query time. A bitemporal query uses both effective time and recorded time.

### 7.5 Normalization pipeline

1. **Accept:** authenticate the execution and validate the observation envelope.
2. **Policy gate:** confirm source, purpose, jurisdiction, fields, residency, and sensitivity are allowed.
3. **Persist raw reference:** hash and encrypt permitted payloads. Record `not_stored` when policy forbids retention.
4. **Parse:** validate the collector output schema without changing meaning.
5. **Canonicalize:** apply a pinned unit, encoding, locale, and identifier normalizer.
6. **Classify:** map to a versioned taxonomy node and sensitivity class.
7. **Resolve subject:** attach to the requested subject or create a proposed identity candidate. Never silently merge.
8. **Deduplicate:** use a semantic fingerprint within source, subject, predicate, effective time, and collector version.
9. **Assess:** calculate confidence components and identify corroboration or contradiction.
10. **Append:** store the assertion and all evidence links in one transaction.
11. **Project:** update disposable current-state and search projections.
12. **Publish:** emit an outbox event after commit for decisions, monitoring, and audit consumers.

Quarantine holds invalid schemas, unknown taxonomy keys, prohibited fields, and unresolved sensitivity. Quarantined records are not available to decisions or AI.

## 8. Relationships and confidence

### 8.1 Relationship model

A relationship is an assertion, not an edge with timeless truth:

```ts
interface RelationshipAssertion {
  relationshipAssertionId: string;
  workspaceId: string | null;
  fromSubjectId: string;
  predicateKey: string;
  toSubjectId: string;
  direction: "directed" | "symmetric";
  role: string | null;
  qualifiers: Record<string, unknown>;
  assertionMode: "declared" | "observed" | "inferred";
  validFrom: string | null;
  validTo: string | null;
  observedAt: string;
  confidence: ConfidenceAssessment;
  status: "proposed" | "accepted" | "disputed" | "retracted" | "superseded";
  policyDecisionId: string;
}
```

Predicate definitions provide inverse names, permitted endpoint types, symmetry, cardinality guidance, transitivity policy, sensitivity, and version. Initial neutral predicates may include `operates`, `registered_to`, `uses_identifier`, `sells_on`, `controls`, `member_of`, `resolves_to`, and `redirects_to`. The architecture does not infer transitive relationships unless a named, versioned rule explicitly permits it.

Every relationship has one or more `relationship_evidence_links`. Competing assertions can coexist. Queries must return status, evidence coverage, and confidence, not a bare edge.

### 8.2 Confidence model

Confidence is a reproducible assessment with components:

```text
base support = weighted independent support / possible support
confidence = clamp(base support
  * extraction quality
  * freshness factor
  * consistency factor
  * identity confidence
  * policy admissibility, 0, 1)
```

Weights come from the source reliability assessment active at observation time. Correlated sources share a correlation group and receive diminishing returns. Contradictory evidence reduces `consistency factor` according to its own reliability and freshness. Missing evidence lowers coverage, not necessarily confidence. Policy inadmissibility is zero for the requesting use, while the underlying permitted record can remain stored.

Each assessment persists the formula version, component values, evidence set hash, source assessments, conflict set, coverage, calculated time, and optional reviewer override. Overrides require a reason and never replace the computed value. User interfaces and APIs must distinguish:

- evidence extraction confidence
- identity resolution confidence
- relationship confidence
- decision confidence
- evidence coverage

## 9. Sensitivity, privacy, and compliance

### 9.1 Sensitivity classification

The mandatory classes are ordered by handling requirements:

| Class | Examples | Baseline handling |
| --- | --- | --- |
| `public` | Public domain and registry facts | Tenant policy and source terms still apply. |
| `internal` | Investigation metadata and operational telemetry | Workspace access and standard retention. |
| `confidential` | Private account data and paid source results | Encryption and restricted export. |
| `personal` | Email, phone, social profile, and person-linked facts | Purpose, jurisdiction, retention, and data subject controls. |
| `sensitive_personal` | Government, financial, precise location, device, or similar regulated data | Explicit allow policy, field encryption, tokenized search, and enhanced audit. |
| `restricted` | Secrets, credentials, prohibited data, or contract-limited payloads | Default deny and exceptional, time-bound access only. |

Classification uses the highest of taxonomy floor, source requirement, subject type, identifier type, collector declaration, and runtime detection. Lowering a class requires reviewed approval.

### 9.2 Policy decision point and enforcement points

The Compliance Gateway exposes:

```ts
interface ComplianceGateway {
  authorize(input: PolicyRequest): Promise<PolicyDecision>;
  classify(input: ClassificationRequest): Promise<ClassificationDecision>;
  retention(input: RetentionRequest): Promise<RetentionDecision>;
  redact(input: RedactionRequest): Promise<RedactedView>;
  recordConsent(input: ConsentRecord): Promise<void>;
  placeLegalHold(input: LegalHoldRequest): Promise<void>;
}
```

Every decision records actor, workspace, purpose, action, subject categories, data categories, jurisdiction, lawful basis reference, consent reference when relevant, policy bundle version, obligations, result, and reason codes.

Enforcement points exist at intake, identity lookup, planning, secret release, provider call, raw storage, normalization, relationship creation, decision evaluation, monitoring, API serialization, export, AI context assembly, retention, and erasure. A policy approval at collection time does not grant every later use.

Required hooks include consent and withdrawal, data subject access, correction, deletion, restriction, legal hold, retention expiry, residency routing, source license limits, sanctions on use, minor and protected-class restrictions, break-glass access, export review, and incident revocation.

### 9.3 Regulated identifier rule

Subject type definitions can declare regulated identifiers as optional capabilities. Planning tests legal usability and availability independently:

- `available=false` means the workflow continues without the identifier.
- `available=true, permitted=false` means it is excluded and the denial is audited.
- `available=true, permitted=true` releases only the minimum fields to an approved collector.
- Derived outputs inherit sensitivity and purpose constraints.

This avoids assumptions that a government ID, payment account, phone, device ID, or person attribute exists or can legally be used.

## 10. Investigation orchestration

### 10.1 Investigation contract

An investigation records subject, purpose, jurisdiction, requested capabilities, requester, workspace, policy snapshot, priority, budget, deadline, and idempotency key. It owns a versioned execution plan.

Planning is deterministic for the same registry snapshot, subject envelope, policy decision, entitlement, and request. The planner:

1. resolves or creates the subject without unsafe merging;
2. evaluates intake policy;
3. queries active collector manifests by compatible type and requested observations;
4. removes collectors that lack authorized identifiers, jurisdiction, purpose, residency, entitlement, or budget;
5. builds a dependency directed acyclic graph from declared inputs and outputs;
6. records selected and skipped collectors with reason codes;
7. pins collector, schema, taxonomy, normalization, freshness, and policy versions;
8. creates executions and publishes queue records through an outbox.

The generic stage sequence is `intake`, `policy`, `planning`, `collection`, `normalization`, `evaluation`, `materialization`, and `completion`. Collector executions supply the detail. Website-specific stages remain in the compatibility projection until old clients migrate.

### 10.2 Runtime and failure behavior

- Leased queue claims use fencing tokens, heartbeats, bounded retries, and dead-letter handling.
- Each execution has an idempotency key and append-only attempt records.
- External calls record a checkpoint before and after I/O.
- A partial collector result can complete an investigation when required coverage policy permits it.
- Investigation cancellation propagates through abort signals and collector cancellation hooks.
- Budgets cover provider cost, calls, payload bytes, and wall time.
- Audit and usage events use the transactional outbox.
- Reprocessing creates a new normalization run against immutable observations.

## 11. Decision Engine, monitoring, and AI interfaces

### 11.1 Decision Engine boundary

```ts
interface DecisionEngineV2 {
  evaluate(request: DecisionRequest, evidence: EvidenceReader): Promise<DecisionResult>;
  explain(decisionId: string, viewPolicy: PolicyDecision): Promise<DecisionExplanation>;
  validatePolicy(bundle: DecisionPolicyBundle): Promise<ValidationResult>;
}

interface DecisionRequest {
  subjectId: string;
  asOf: string;
  purpose: string;
  policyBundleVersion: string;
  evidenceSelectionPolicyVersion: string;
  minimumCoverage: Record<string, number>;
}
```

The reader returns policy-filtered assertions and relationships with provenance. A result contains outcome, confidence, coverage, reasons, evidence set hash, policy versions, engine version, evaluation time, expiry, and status. Outcomes include `insufficient_evidence`. Decision logic cannot call collectors or query raw payloads. Re-evaluation appends a new result.

Existing decision APIs continue through adapters that translate current evidence into this request and preserve current response fields.

### 11.2 Monitoring boundary

```ts
interface MonitorDefinition {
  monitorId: string;
  subjectId: string;
  purpose: string;
  policySnapshotId: string;
  collectorSelectors: string[];
  schedule: string;
  baselineStrategy: "previous" | "approved" | "rolling";
  changePolicyVersion: string;
  notificationPolicyVersion: string;
  status: "active" | "paused" | "blocked" | "retired";
}
```

The scheduler reauthorizes policy, source terms, entitlement, and identifiers before every run. It then creates a normal investigation. The change engine compares policy-filtered, normalized assertion sets. It records added, removed, changed, expired, disputed, and confidence-shift events. Alerts reference change events and support deduplication, severity policy, acknowledgment, and delivery attempts.

A monitor pauses with an auditable reason when consent expires, identifiers are erased, a collector is disabled, or purpose becomes invalid. Existing website watchlists map to monitors through an adapter. Historical scan comparison remains available during migration.

### 11.3 Future AI boundary

AI systems consume an `AIContextBundle`, never unrestricted tables or raw provider payloads:

```ts
interface AIContextBundle {
  bundleId: string;
  subject: RedactedSubjectView;
  assertions: CitedAssertion[];
  relationships: CitedRelationship[];
  decisions: DecisionSummary[];
  allowedTasks: string[];
  prohibitedUses: string[];
  sensitivity: SensitivityClass;
  purpose: string;
  policyDecisionId: string;
  asOf: string;
  expiresAt: string;
  evidenceSetHash: string;
}
```

The AI Gateway authorizes purpose, minimizes fields, redacts identifiers, limits time and token volume, and returns stable citations. Model outputs are `ai_artifacts` with model and prompt-template versions, input bundle hash, output schema, uncertainty, citations, policy decision, human review state, and expiry. AI outputs do not become evidence automatically. Promotion to an assertion requires a named extraction or inference policy, evidence links, and review level. Training use requires a distinct explicit policy.

## 12. API contracts

All new endpoints use `/api/v2`, UUID resource identifiers, ISO 8601 UTC timestamps, cursor pagination, `Idempotency-Key` on writes, and `application/problem+json` errors. Responses include `schemaVersion`. Sensitive values use masked views. `ETag` and `If-Match` protect mutable definitions.

| Method and path | Purpose |
| --- | --- |
| `POST /api/v2/subjects` | Create or resolve a subject under explicit resolution policy. |
| `GET /api/v2/subjects/{subjectId}` | Get the authorized subject envelope. |
| `POST /api/v2/subjects/{subjectId}/identifiers` | Attach an authorized identifier claim. |
| `GET /api/v2/subjects/{subjectId}/assertions` | Query assertions by taxonomy, validity, status, and `asOf`. |
| `GET /api/v2/subjects/{subjectId}/relationships` | Query evidence-backed relationship assertions. |
| `POST /api/v2/investigations` | Create an investigation and return `202` or the idempotent result. |
| `GET /api/v2/investigations/{id}` | Read plan, executions, policy state, coverage, and result links. |
| `POST /api/v2/investigations/{id}/cancel` | Request cancellation. |
| `POST /api/v2/monitors` | Create a policy-approved monitor. |
| `GET /api/v2/monitors/{id}/changes` | Read normalized change events. |
| `POST /api/v2/decisions` | Evaluate a pinned evidence set and policy. |
| `GET /api/v2/decisions/{id}` | Read a decision and cited explanation. |

Example investigation request:

```json
{
  "schemaVersion": "2.0",
  "subject": {
    "subjectId": "optional-existing-uuid",
    "type": "digital.domain",
    "identifier": { "type": "domain_name", "value": "example.com" }
  },
  "purpose": "vendor_due_diligence",
  "jurisdiction": "GB",
  "requestedCapabilities": ["website_intelligence"],
  "constraints": { "deadline": "2026-07-26T12:00:00Z", "maximumCostUsd": 2 }
}
```

The response identifies skipped capabilities with stable reason codes such as `IDENTIFIER_UNAVAILABLE`, `POLICY_DENIED`, `COLLECTOR_DISABLED`, and `BUDGET_EXCEEDED`. It does not expose sensitive policy details.

Compatibility requirements:

- Existing `/api/investigations` accepts domain and website requests unchanged.
- Existing investigation status fields remain until a published sunset date.
- Existing scan, report, decision, watchlist, and alert identifiers remain resolvable.
- Additive fields are optional for old clients. Breaking semantic changes require `/api/v3`.
- Database views and adapters translate legacy subject type and stage names.

## 13. Logical database model

All tenant-owned tables carry `workspace_id`, even when it can be reached through a parent. This enables simple RLS, partitioning, audit, and deletion. Public records use a separate explicit visibility policy. Foreign keys must not allow a private record to reference another tenant.

### Registry and policy tables

- `subject_type_definitions(key, version, parent_key, attribute_schema, status)`
- `identifier_type_definitions(key, version, normalization_profile, sensitivity, match_policy, status)`
- `evidence_taxonomy_nodes(key, version, value_schema, freshness_policy_key, sensitivity_floor, status)`
- `relationship_predicate_definitions(key, version, endpoint_rules, inverse_key, sensitivity, status)`
- `collector_manifests(collector_key, version, contract_version, manifest, digest, status)`
- `sources(source_id, source_key, owner, kind, jurisdiction, terms_ref, policy, status)`
- `source_reliability_assessments(assessment_id, source_id, taxonomy_key, dimensions, score, validity)`
- `policy_bundles(policy_bundle_id, version, digest, effective_period, status)`
- `policy_decisions(policy_decision_id, workspace_id, action, purpose, input_digest, result, obligations)`
- `consent_records`, `legal_holds`, and `retention_schedules`

### Identity tables

- `subjects`, extended with type key, type version, revision, and deletion state
- `subject_identifiers`, extended with scheme, ciphertext, lookup token, availability, sensitivity, and validity
- `subject_revisions(subject_revision_id, subject_id, revision, changed_fields, actor, reason)`
- `identity_resolution_decisions(resolution_id, workspace_id, candidates, confidence, version, review_status)`
- `subject_merge_events(merge_event_id, source_subject_id, target_subject_id, resolution_id, effective_at)`

### Collection and orchestration tables

- `investigations`, replacing the generic meaning of current jobs while retaining their identifiers
- `investigation_plans(plan_id, investigation_id, registry_snapshot, policy_snapshot, digest)`
- `collector_executions(execution_id, plan_id, collector_key, version, status, lease_fence, idempotency_key)`
- `collector_attempts(attempt_id, execution_id, status, timing, checkpoint, safe_failure)`
- `provider_usage_events`, extended to reference execution and source
- `provider_result_cache`, extended with policy scope, sensitivity, schema digest, and residency
- `outbox_events` and `dead_letter_events`

### Evidence and relationship tables

- `source_instances(source_instance_id, source_id, locator, checksum, published_at, effective_at)`
- `raw_payloads(payload_id, workspace_id, object_ref, checksum, encryption_key_ref, sensitivity, retention_until)`
- `evidence_observations`, extended with execution, source instance, taxonomy version, sensitivity, effective interval, and supersession
- `evidence_assertions(assertion_id, workspace_id, subject_id, predicate, typed_value, validity, status, confidence)`
- `assertion_evidence_links(assertion_id, observation_id, contribution, role)`
- `relationship_assertions`, as defined above
- `relationship_evidence_links(relationship_assertion_id, assertion_id, contribution)`
- `normalization_runs(run_id, normalizer_versions, input_digest, status)`
- `evidence_quarantine(quarantine_id, observation_id, reason_code, review_status)`

### Consumption tables

- `decision_results` and `decision_evidence_links`
- `monitor_definitions`, `monitor_runs`, `change_events`, `alerts`, and `notification_attempts`
- `ai_context_bundles`, `ai_artifacts`, and `ai_artifact_citations`
- `platform_audit_events`, extended with policy decision and sensitivity-safe metadata

Large append-only tables partition by recorded month and optionally workspace hash. Lookup indexes lead with `workspace_id`. Identifier tokens use `(workspace_id, identifier_type_key, lookup_token)`. Current projections use partial indexes by active status. Payload storage and database rows share retention and legal-hold controls.

### Integrity and access controls

- RLS applies to every tenant table and child table.
- Service writes require a scoped database role, not a general service role in collector code.
- Append-only tables reject update and delete outside retention procedures.
- Cross-table triggers validate workspace equality and sensitivity inheritance.
- Transactional outbox rows commit with state changes.
- Encryption keys are workspace and sensitivity scoped with rotation metadata.
- Audit metadata uses allowlisted fields and never stores raw identifiers.

## 14. Evolution over time

Evidence evolution is explicit:

- New observation: append it with observed, effective, and recorded timestamps.
- Same fact from another source: append and link it as corroboration.
- Changed fact: append a new assertion and close or supersede the previous validity interval.
- Source correction: append a retraction or corrected assertion.
- Taxonomy change: preserve the old node version and run a new normalization version.
- Reliability change: future assessments use it. Historical decisions retain their pinned assessment.
- Policy change: views are reauthorized. Stored data is retained, redacted, restricted, or erased according to the new obligation.
- Subject merge: redirect reads while preserving original evidence ownership and merge history.
- Reprocessing: generate new assertions from the same observation without mutating old assertions.

An `asOf` query selects effective time. An audit query can also specify `knownAt` for recorded time. Monitoring compares assertion sets, not raw response shape.

## 15. Required changes in the existing codebase

### Platform Core

- Replace the closed `SubjectType` union in `lib/platformCore/types.ts` with registry-backed type keys and compatibility aliases.
- Split the current combined evidence observation shape into source, observation, assertion, evidence-link, and confidence contracts.
- Generalize `SubjectResolutionService` in `lib/platformCore/subjects.ts`. Move normalization into identifier type definitions. Preserve `normalizeDomain` and `normalizeWebsiteUrl` exports as adapters.
- Replace `WEBSITE_STAGES` in `lib/platformCore/jobs.ts` with generic investigation stages and collector executions. Keep a legacy stage projection.
- Replace the website-only worker in `lib/platformCore/worker.ts` with a generic execution runner. Move the current call to `investigateWebsite` into a Website Intelligence collector adapter.
- Extend `lib/platformCore/supabase.ts` for generic investigation, registry, execution, observation, and assertion persistence.
- Add packages under `lib/platformCore/` for registries, policies, sources, normalization, confidence, relationships, outbox, and versioned contracts.

### Website Intelligence

- Add a v2 manifest and adapter under `lib/websiteIntelligence/`. It wraps the current `investigateWebsite` behavior and maps module evidence into observation envelopes.
- Keep `lib/websiteIntelligence/types.ts`, canonical reports, scans, history, watchlists, and alerts stable.
- Move Website Intelligence freshness mappings from the platform-wide `FRESHNESS_POLICY` into its taxonomy and collector registration.
- Route legacy monitoring through the monitor adapter only after parity tests pass.

### Orchestration, platform catalog, and APIs

- Replace the fixed `OrchestratorEngineId` planner in `lib/orchestrator/` with registry queries and dependency planning. Maintain the existing execution plan mapper.
- Update `lib/platform/types.ts` and `lib/platform/registry.ts` from a Trust Intelligence catalog to an Entity Intelligence capability catalog. Preserve old capability identifiers through aliases.
- Add `/api/v2` route handlers for subjects, investigations, evidence, relationships, decisions, and monitors.
- Keep `app/api/investigations/route.ts` and its status route as compatibility facades.
- Generalize `app/api/internal/investigation-worker/route.ts` to claim collector executions after the migration gate is enabled.
- Apply authorization and serialization policy hooks to current entity, relationship, decision, case, report, website scan, watchlist, and alert routes.

### Decisions, monitoring, identity, and graph code

- Add the evidence reader interface to `lib/decisionEngine/`. Adapt current evaluator inputs and persist evidence set hashes.
- Add monitor repository and scheduler interfaces to `lib/monitoringEngine/`. Map `lib/trustWatch/` and Website Intelligence watchlists to them.
- Consolidate overlapping identity concepts in `lib/identity/`, `lib/knowledgeGraph/`, `lib/graph/`, `lib/ontology/`, and `lib/businessGraph/` behind platform contracts.
- Freeze `lib/trustGraph/` feature development. Its APIs can read relationship projections during migration, but Phase 2 must not add Trust Graph behavior.
- Treat `lib/businessIdentityResolver.ts`, `lib/identityEngine.ts`, and target classifier outputs as candidate signals. They must not directly merge subjects.
- Update `lib/evidence/` to produce or consume registered taxonomy keys rather than maintain a parallel canonical model.

### Database, operations, and tests

- Add additive Supabase migrations for registries, policy records, source records, encrypted identifiers, executions, assertions, relationships, outbox, monitors, and compatibility views.
- Retain all Phase 1 tables and columns until backfill, dual-write comparison, and rollback windows complete.
- Replace direct REST multi-step worker writes with transactional database functions or a repository that writes state and outbox atomically.
- Introduce scoped worker roles, payload object storage policy, key management, partition maintenance, retention jobs, and dead-letter operations.
- Add contract fixtures, registry validation, RLS tests, policy-denial tests, bitemporal evidence tests, retry and idempotency tests, compatibility snapshots, and migration rollback checks.
- Update `docs/platform-core-phase-1.md`, production architecture, deployment guides, capability docs, and API documentation when each relevant change ships.

## 16. Implementation roadmap in independently deployable PRs

Every PR below is additive or protected by a disabled feature flag. Each includes migration rollback guidance, telemetry, compatibility tests, and documentation. No PR adds a new collector or intelligence module.

### PR 1: Contract vocabulary and architecture guardrails

- Add versioned TypeScript interfaces for subjects, identifiers, sources, observations, assertions, relationships, policy decisions, collector manifests, executions, decisions, monitors, and AI context bundles.
- Add architecture tests that forbid collector imports from platform core and direct canonical evidence writes from collectors.
- Ship no runtime behavior change.

### PR 2: Registry tables and read-only registry service

- Add subject type, identifier type, taxonomy, relationship predicate, and collector manifest tables.
- Seed compatibility definitions for every existing type and Website Intelligence output.
- Add schema and semantic validation. Keep current unions and registries authoritative at runtime.

### PR 3: Sensitivity and compliance decision records

- Add sensitivity types, policy bundles, policy decision persistence, audit reason codes, and a deny-by-default gateway interface.
- Wire the gateway in audit-only mode around current intake and reads. Existing behavior remains unchanged, while mismatches generate internal metrics.

### PR 4: Subject v2 additive schema

- Add type key, type version, revision, and deletion state to subjects.
- Add identifier availability, sensitivity, normalizer version, ciphertext, token, and validity columns.
- Backfill compatibility values and expose legacy views. Domain behavior remains identical.

### PR 5: Generic subject service

- Implement registry-backed validation and normalizer dispatch for existing identifiers only.
- Add identity resolution decision and merge event storage.
- Keep existing domain functions and route contract as adapters. Do not enable weak-identifier auto-merge.

### PR 6: Source Registry and reliability assessments

- Add sources, source instances, and reliability assessment storage and APIs for internal administration.
- Register sources already used by Website Intelligence. Unknown reliability remains explicit.
- No collector behavior changes.

### PR 7: Evidence ledger foundation

- Add raw payload metadata, observations v2, assertions, links, quarantine, and normalization run tables.
- Add append-only and tenant integrity controls.
- Dual-write current Phase 1 observations into a compatibility ingestion boundary. Old reads remain authoritative.

### PR 8: Normalization pipeline for existing website evidence

- Implement accept, validate, classify, normalize, deduplicate, assess, append, project, and outbox stages for current Website Intelligence outputs.
- Compare v1 and v2 evidence in shadow mode. Quarantine does not affect the existing report.
- Enable v2 reads only after parity thresholds pass.

### PR 9: Collector Registry runtime and Website Intelligence adapter

- Implement manifest resolution and the Collector V2 runtime.
- Register one adapter for the existing Website Intelligence collector.
- Run the adapter in shadow mode beside the current worker. No new collection occurs.

### PR 10: Generic plans and collector executions

- Add investigations, plans, executions, attempts, checkpoints, outbox, and dead-letter storage.
- Introduce the generic planner and leased runner behind a workspace rollout flag.
- Preserve current job identifiers, stages, retry semantics, status endpoint, and worker rollback path.

### PR 11: Relationship assertion ledger

- Add predicate definitions, temporal relationship assertions, evidence links, confidence components, disputes, and retractions.
- Add read APIs and compatibility mapping for existing relationships.
- Do not implement Trust Graph scoring, traversal intelligence, or inferred expansion.

### PR 12: API v2 read contracts

- Add authorized subject, assertion, relationship, and investigation reads with cursor pagination and bitemporal filters.
- Add problem details, schema versions, masking, and stable citations.
- Keep all existing routes and response snapshots unchanged.

### PR 13: API v2 investigation writes

- Add generic investigation creation and cancellation with purpose, jurisdiction, requested capabilities, budgets, and idempotency.
- Initially allow only the existing Website Intelligence capability.
- Make the existing investigation endpoint a facade over v2 for flagged workspaces.

### PR 14: Decision Engine evidence reader

- Introduce the policy-filtered evidence reader, decision input snapshot, evidence set hash, coverage, and `insufficient_evidence` interface.
- Adapt current decision evaluation without changing legacy results.
- Shadow-compare persisted v1 and v2 decision provenance.

### PR 15: Generic monitoring interfaces

- Add monitor definitions, runs, assertion-set changes, alert records, and scheduler policy reauthorization.
- Adapt current website watchlists and alerts behind a flag.
- Preserve existing watchlist routes, schedules, and notifications.

### PR 16: AI Gateway contracts only

- Add AI context bundle assembly, citation, redaction, artifact, and review interfaces.
- Add policy tests that block raw payload and unauthorized identifier access.
- Do not call a model or generate intelligence.

### PR 17: Enforcement and scoped runtime identities

- Move from audit-only policy checks to enforced checks by action and workspace rollout.
- Replace broad service writes with scoped worker roles and secret broker grants.
- Enable retention, erasure, legal hold, residency, and break-glass procedures.

### PR 18: Cutover, reconciliation, and legacy retirement plan

- Backfill v2 assertions and execution links, reconcile counts and hashes, then switch reads by capability.
- Publish deprecation dates and keep reversible compatibility views through the agreed support window.
- Remove dual writes only after parity, restore drills, and rollback drills pass. Schema removal requires a later dedicated PR.

## 17. Acceptance criteria

The foundation is ready when:

- A new subject type and collector manifest can be registered without editing orchestration code or altering core tables.
- The current Website Intelligence investigation produces the same legacy API and report while also producing valid v2 provenance.
- Every assertion traces to authorized source observations, collector execution, taxonomy, normalizer, policy, and confidence versions.
- Relationship queries return temporal evidence and confidence components, never unexplained edges.
- Policy tests prove purpose, jurisdiction, tenant, sensitivity, retention, erasure, and AI boundaries.
- Unavailable or prohibited regulated identifiers do not prevent a subject from existing and do not leak through logs or APIs.
- An investigation can retry, cancel, partially complete, and recover an expired lease without duplicate evidence.
- Monitoring compares normalized assertions and reauthorizes before collection.
- Decision outputs can be reproduced from a pinned, hashed evidence set.
- AI context is minimized, cited, expiring, and policy-filtered. AI output remains separate from evidence.
- Backfills, dual writes, cutovers, and rollbacks have automated reconciliation and operational runbooks.

## 18. Architectural answers

- **How does every collector plug in?** It registers an immutable manifest and implements Collector V2. The planner selects it from declared compatibility and policy. The runner supplies scoped capabilities and accepts observation envelopes only.
- **How is every entity represented?** A stable subject UUID references a versioned type definition. Optional identifiers and attributes are separate, temporal, sensitive claims.
- **How is evidence normalized?** A versioned, policy-gated pipeline turns immutable source observations into typed assertions with full provenance and quarantine.
- **How are relationships represented?** Temporal relationship assertions connect two subjects through registered predicates and evidence links.
- **How is confidence calculated?** A versioned assessment combines independent source support, extraction quality, freshness, consistency, identity confidence, and policy admissibility. It retains all components.
- **How does evidence evolve?** New facts, corrections, retractions, and reprocessing append records. Bitemporal queries and supersession preserve historical meaning.
- **How does monitoring work?** A monitor reauthorizes and starts a normal investigation, then compares normalized assertion sets and emits durable change events and alerts.
- **How does future AI consume the platform?** An AI Gateway creates minimized, cited, expiring context bundles. Outputs are reviewable artifacts, not evidence by default.
- **How are legal and privacy boundaries enforced?** A deny-by-default Compliance Gateway is called at every collection, storage, use, export, monitoring, and AI enforcement point. Decisions and obligations are audited.
- **How are future regulated identifiers supported?** Identifier definitions describe sensitivity and lawful matching. Values can be absent, encrypted, redacted, or erased. Availability and permission are evaluated separately for every use.


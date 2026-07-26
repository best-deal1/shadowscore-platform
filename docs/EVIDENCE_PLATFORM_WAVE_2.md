# Evidence Platform, Wave 2

## Architecture summary

The canonical flow is provider, source, source instance, observation, assertion, evidence link, and current projection. A provider identifies the organization or system. A source identifies a stable data product. A source instance records one acquisition at a specific time.

Collectors append observations only. The normalization pipeline validates policy, canonicalizes values, maps taxonomy, deduplicates canonical values, calculates explicit confidence components, appends assertions and links, updates the disposable projection, and emits an outbox event. A rejected input is copied to quarantine with its failed stage and reason.

Assertions carry valid time in `valid_from` and `valid_to`. They carry transaction time in `recorded_at`. Changed facts create a new assertion version that points to the prior assertion. Database triggers reject updates and deletes on canonical evidence tables.

## Evidence and source model

`evidence_providers`, `evidence_sources`, and `evidence_source_instances` form the source registry. `evidence_v2_observations` stores collector output. `evidence_assertions` stores normalized claims. `assertion_observation_links` provides direct provenance. `evidence_links` can associate assertions without introducing a relationship ledger.

`current_evidence_projection` is a read model. It can be truncated and rebuilt with `rebuild_current_evidence_projection()`. The source instances, observations, assertions, and links remain intact.

## Assertion contract

Every assertion has a stable assertion key, taxonomy, subject, JSON value, provenance, confidence components, overall confidence, valid interval, transaction timestamp, policy version, canonical value hash, and one or more observation links. The TypeScript contract is in `lib/evidenceV2/types.ts`.

## API addition

`GET /api/evidence/subjects/{subjectId}` returns the current evidence projection visible to the authenticated workspace. The optional `taxonomy` query parameter filters the result. The endpoint returns projections, not the historical ledger.

## Compatibility report

Website Intelligence remains the only production collector. Its worker writes the existing scan and legacy `evidence_observations` first. It then appends one Website Intelligence source instance and Evidence V2 observations. It does not create assertions. Existing report construction and response contracts are unchanged. Legacy reports remain authoritative while parity is measured.

## Rollback plan

1. Stop the investigation worker before rollback to prevent partial dual-writes.
2. Revert the application commit so the worker stops writing Evidence V2.
3. Keep all Evidence V2 tables in place for audit and recovery. They are additive and do not alter legacy report reads.
4. If storage removal is required after export and approval, drop the Wave 2 projection first, then links, assertions, normalization runs, observations, source instances, sources, and providers.
5. Resume the legacy worker. Existing scans and `evidence_observations` remain authoritative throughout rollback.

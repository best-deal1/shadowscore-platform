# Trust Intelligence Platform

## Product boundary

ShadowScore is Business Trust Infrastructure. It provides reusable Trust Intelligence capabilities for business identity, evidence, risk, monitoring, relationships, and decisions.

The product UI is a consumer of those capabilities. It is not their boundary. The Command Center helps teams prioritize attention, understand the business impact, review supporting evidence, and take the next decision.

## Capability catalog

`lib/platform` is the source of truth for the platform capability catalog. It gives the Command Center, the workspace, and future API integrations a shared vocabulary.

| Capability | Responsibility | Primary output |
| --- | --- | --- |
| Identity Engine | Resolve a business identity from available evidence. | Canonical identity and provenance. |
| Evidence Engine | Normalize source observations into evidence. | Evidence items and coverage. |
| Trust Engine | Interpret trust signals without replacing source evidence. | Trust insights and timeline. |
| Risk Engine | Evaluate risk indicators and business impact. | Risk score and reasons. |
| Monitoring Engine | Detect changes in tracked signals. | Snapshots, changes, and alerts. |
| Decision Engine | Produce an explainable recommendation. | Decision, confidence, and action. |
| Intelligence Engine | Build business context from approved findings. | Findings and narrative. |
| Relationship Graph | Connect entities and evidence across time. | Entities, relationships, and graph summary. |

The catalog is available at `GET /api/platform/capabilities`. It contains capability metadata only, never customer data or internal execution records.

## Engineering rule

Optimize for stronger platform capabilities, not more screens. A feature must strengthen an intelligence engine, the relationship graph, enterprise workflow, or an integration boundary. Isolated presentation work should not create a second source of truth for platform data.

## Integration contract

1. Engine output remains typed and owned by its domain package.
2. The report pipeline coordinates engines. It does not move domain logic into UI routes.
3. UI, public API, and partner API consumers read stable contracts. They do not import provider execution or internal reasoning.
4. Capability metadata is versioned through `TRUST_INTELLIGENCE_PLATFORM_VERSION`.
5. New engines must be added to `lib/platform/registry.ts` with outputs, consumers, and an implementation boundary.

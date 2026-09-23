# Intelligence Layer

## Boundaries

The Trust Graph is the canonical record of entities, relationships, provenance, evidence references, timeline events, trust state, and recorded decisions. The Intelligence Layer reads that record through `IntelligenceGraphReader`. It does not write graph facts or Decision Memory.

Intelligence Services turn graph data into deterministic, explainable results. The Decision Engine may consume a recommendation and explicitly record a permanent decision. API routes only adapt HTTP requests to the reusable service. UI, integrations, and future agents use the same result contract.

## Result contract and explainability

Every result contains an ID, entity ID, intelligence type, conclusion, normalized confidence, evidence IDs, relationship IDs, affected entity IDs, structured reasoning path, actions, generation time, engine name, and engine version. Recommendations also include a policy version in `details`.

Reasoning steps describe the graph input, source, evidence and relationships used, deterministic interpretation, and its effect. They are audit records, not hidden model reasoning. Evidence IDs always originate in the Trust Graph. The engine never manufactures evidence.

## Adding a capability

Add a method to `IntelligenceService`, use only `IntelligenceGraphReader`, and return the shared `IntelligenceResult`. Add deterministic fixtures and tests for the normal, missing-data, and contradictory-data paths. Expose the method through the API adapter only after it is independently testable.

Rules currently assess required business evidence, relationship confidence and connected risk flags, conflicting attributes, timeline changes, and recommendations. Future AI assistance can summarize or prioritize these outputs, but must preserve the graph facts, evidence IDs, confidence, uncertainty, and rule result as authoritative.

## Enterprise integration

The graph adapter is the isolation boundary. A production adapter must scope every graph read to the authenticated tenant and enforce RBAC before the service is called. Callers should record request identity, result ID, engine version, policy version, duration, and failure outcome in their audit and observability systems. The in-memory graph store is suitable for deterministic development and test fixtures, not multi-tenant persistence.

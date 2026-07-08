import type { OntologyAttributes, OntologyEntity, OntologyEntityType, OntologySource } from "./types";

export const ONTOLOGY_ENTITY_TYPES = [
  "BusinessEntity",
  "Domain",
  "Email",
  "Phone",
  "MarketplaceAccount",
  "PaymentAccount",
  "Supplier",
  "RiskSignal",
  "EvidenceItem",
  "EnforcementEvent",
  "Recommendation",
  "ObservedOutcome",
] as const satisfies readonly OntologyEntityType[];

export type EntityInput = {
  type: OntologyEntityType;
  label: string;
  source: OntologySource | string;
  confidence?: number;
  createdAt?: string;
  evidenceRefs?: string[];
  attributes?: OntologyAttributes;
  stableKey?: string;
};

export function stableOntologyId(prefix: string, value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prefix}:${normalized || "unknown"}`;
}

export function createOntologyEntity(input: EntityInput): OntologyEntity {
  return {
    id: stableOntologyId(input.type, input.stableKey ?? input.label),
    type: input.type,
    label: input.label,
    source: input.source,
    confidence: clampConfidence(input.confidence ?? 0.7),
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    evidenceRefs: input.evidenceRefs ?? [],
    ...(input.attributes ? { attributes: input.attributes } : {}),
  } as OntologyEntity;
}

export function clampConfidence(confidence: number): number {
  if (Number.isNaN(confidence)) return 0;
  return Math.max(0, Math.min(1, Number(confidence.toFixed(4))));
}

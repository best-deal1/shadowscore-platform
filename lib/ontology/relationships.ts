import { clampConfidence, stableOntologyId } from "./entities";
import type { OntologyAttributes, OntologyRelationship, OntologyRelationshipType, OntologySource } from "./types";

export const ONTOLOGY_RELATIONSHIP_TYPES = [
  "OWNS",
  "USES",
  "OPERATES_ON",
  "CONTACTED_BY",
  "SUPPLIED_BY",
  "LINKED_TO",
  "TRIGGERED",
  "RECOMMENDED_ACTION",
  "RESULTED_IN",
] as const satisfies readonly OntologyRelationshipType[];

export type RelationshipInput = {
  type: OntologyRelationshipType;
  from: string;
  to: string;
  source: OntologySource | string;
  confidence?: number;
  createdAt?: string;
  evidenceRefs?: string[];
  label?: string;
  attributes?: OntologyAttributes;
};

export function createOntologyRelationship(input: RelationshipInput): OntologyRelationship {
  const label = input.label ?? `${input.from} ${input.type} ${input.to}`;
  return {
    id: stableOntologyId("relationship", `${input.type}:${input.from}:${input.to}:${label}`),
    type: input.type,
    from: input.from,
    to: input.to,
    label,
    source: input.source,
    confidence: clampConfidence(input.confidence ?? 0.7),
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    evidenceRefs: input.evidenceRefs ?? [],
    ...(input.attributes ? { attributes: input.attributes } : {}),
  };
}

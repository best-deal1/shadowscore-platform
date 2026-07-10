import type { OntologyRelationship } from "../ontology/types";
import type { GraphEdge, GraphRelationship } from "./types";

export const GRAPH_RELATIONSHIPS: readonly GraphRelationship[] = [
  "INVESTIGATED",
  "USES",
  "OWNS",
  "RESOLVED_TO",
  "SUPPORTED_BY",
  "GENERATED",
  "RELATED_TO",
  "OBSERVED_IN",
  "VERIFIED_BY",
  "LINKED_TO",
] as const;

export function createGraphEdge(input: GraphEdge): GraphEdge {
  return {
    from: input.from,
    to: input.to,
    relationship: input.relationship,
    confidence: clampConfidence(input.confidence),
    evidenceRefs: unique(input.evidenceRefs),
  };
}

export function mapOntologyRelationship(type: OntologyRelationship["type"]): GraphRelationship {
  switch (type) {
    case "OWNS":
    case "USES":
    case "LINKED_TO":
      return type;
    case "OPERATES_ON":
    case "CONTACTED_BY":
      return "USES";
    case "SUPPLIED_BY":
      return "SUPPORTED_BY";
    case "TRIGGERED":
      return "GENERATED";
    case "RECOMMENDED_ACTION":
      return "RESOLVED_TO";
    case "RESULTED_IN":
      return "OBSERVED_IN";
    default:
      return "RELATED_TO";
  }
}

export function edgeKey(edge: GraphEdge): string {
  return `${edge.from}|${edge.relationship}|${edge.to}`;
}

function clampConfidence(confidence: number): number {
  if (Number.isNaN(confidence)) return 0;
  return Math.max(0, Math.min(1, confidence));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

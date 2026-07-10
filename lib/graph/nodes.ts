import type { Investigation } from "../investigation/types";
import type { OntologyEntity } from "../ontology/types";
import type { GraphNode, GraphNodeType } from "./types";

export const GRAPH_NODE_TYPES: readonly GraphNodeType[] = [
  "BusinessIdentity",
  "Investigation",
  "EvidenceItem",
  "RiskSignal",
  "Provider",
  "Recommendation",
  "ObservedOutcome",
  "MarketplaceAccount",
  "PaymentAccount",
  "Domain",
  "Email",
  "Phone",
] as const;

export function createInvestigationNode(investigation: Investigation): GraphNode {
  return {
    id: investigationNodeId(investigation.investigationId),
    type: "Investigation",
    label: investigation.normalizedTarget || investigation.target,
    confidence: investigation.verificationScore ?? 0.5,
    source: "investigation",
    createdAt: investigation.createdAt,
    evidenceRefs: investigation.evidenceRefs,
    attributes: {
      status: investigation.status,
      targetType: investigation.targetType,
      outcome: investigation.outcome,
      reportId: investigation.reportId,
      intakeId: investigation.intakeId,
    },
  };
}

export function createProviderNode(providerId: string, createdAt: string, confidence: number): GraphNode {
  return {
    id: stableGraphId("provider", providerId),
    type: "Provider",
    label: providerId,
    confidence,
    source: "provider-execution",
    createdAt,
  };
}

export function createGraphNodeFromOntology(entity: OntologyEntity): GraphNode | null {
  const type = mapOntologyTypeToGraphType(entity.type);
  if (!type) return null;

  return {
    id: stableGraphId(type, entity.id),
    type,
    label: entity.label,
    confidence: entity.confidence,
    source: entity.source,
    createdAt: entity.createdAt,
    evidenceRefs: entity.evidenceRefs,
    attributes: entity.attributes,
  };
}

export function investigationNodeId(investigationId: string): string {
  return stableGraphId("investigation", investigationId);
}

export function stableGraphId(namespace: string, value: string): string {
  return `${normalizeToken(namespace)}:${normalizeToken(value)}`;
}

export function mapOntologyTypeToGraphType(type: OntologyEntity["type"]): GraphNodeType | null {
  switch (type) {
    case "BusinessEntity":
      return "BusinessIdentity";
    case "Domain":
    case "Email":
    case "Phone":
    case "MarketplaceAccount":
    case "PaymentAccount":
    case "RiskSignal":
    case "EvidenceItem":
    case "Recommendation":
    case "ObservedOutcome":
      return type;
    case "Supplier":
    case "EnforcementEvent":
      return "EvidenceItem";
    default:
      return null;
  }
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

import type { GraphNode, KnowledgeGraph } from "./types";

export function findIdentity(graph: KnowledgeGraph, labelOrId?: string): GraphNode[] {
  return byType(graph, "BusinessIdentity").filter((node) => matches(node, labelOrId));
}

export function findEvidence(graph: KnowledgeGraph, evidenceRefOrLabel?: string): GraphNode[] {
  return byType(graph, "EvidenceItem").filter((node) => matchesEvidence(node, evidenceRefOrLabel));
}

export function findInvestigations(graph: KnowledgeGraph, labelOrId?: string): GraphNode[] {
  return byType(graph, "Investigation").filter((node) => matches(node, labelOrId));
}

export function findRelatedBusinesses(graph: KnowledgeGraph, businessId: string): GraphNode[] {
  const relatedIds = new Set(
    graph.edges
      .filter((edge) => edge.relationship === "RELATED_TO" || edge.relationship === "LINKED_TO" || edge.relationship === "OWNS")
      .flatMap((edge) => edge.from === businessId ? [edge.to] : edge.to === businessId ? [edge.from] : []),
  );
  return byType(graph, "BusinessIdentity").filter((node) => relatedIds.has(node.id));
}

export function findRecommendations(graph: KnowledgeGraph, labelOrId?: string): GraphNode[] {
  return byType(graph, "Recommendation").filter((node) => matches(node, labelOrId));
}

export function findRiskSignals(graph: KnowledgeGraph, labelOrId?: string): GraphNode[] {
  return byType(graph, "RiskSignal").filter((node) => matches(node, labelOrId));
}

function byType(graph: KnowledgeGraph, type: GraphNode["type"]): GraphNode[] {
  return graph.nodes.filter((node) => node.type === type);
}

function matches(node: GraphNode, query?: string): boolean {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return node.id.toLowerCase().includes(normalized) || node.label.toLowerCase().includes(normalized);
}

function matchesEvidence(node: GraphNode, query?: string): boolean {
  if (matches(node, query)) return true;
  if (!query) return true;
  return Boolean(node.evidenceRefs?.some((ref) => ref.toLowerCase().includes(query.toLowerCase())));
}

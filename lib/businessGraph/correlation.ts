import type { BusinessGraph, BusinessGraphCorrelation, BusinessGraphCorrelationType, BusinessGraphNode, BusinessGraphNodeType } from "./types";

const CORRELATION_BY_NODE_TYPE: Partial<Record<BusinessGraphNodeType, BusinessGraphCorrelationType>> = {
  Email: "same_email",
  Phone: "same_phone",
  Address: "same_address",
  "Company Registry": "same_domain_owner",
  Marketplace: "same_marketplace_identity",
};

function businessIdsForNode(graph: BusinessGraph, nodeId: string) {
  return Array.from(new Set(graph.edges.filter((edge) => edge.to === nodeId).map((edge) => edge.from).filter((id) => id.startsWith("business:"))));
}

function confidenceFor(nodes: BusinessGraphNode[]): BusinessGraphCorrelation["confidence"] {
  if (nodes.some((node) => node.confidence === "High")) return "High";
  if (nodes.some((node) => node.confidence === "Medium")) return "Medium";
  return "Low";
}

export function detectBusinessGraphCorrelations(graph: BusinessGraph): BusinessGraphCorrelation[] {
  const grouped = new Map<string, BusinessGraphNode[]>();

  for (const node of graph.nodes) {
    const correlationType = CORRELATION_BY_NODE_TYPE[node.type];
    if (!correlationType) continue;
    const key = `${correlationType}:${node.normalizedValue}`;
    grouped.set(key, [...(grouped.get(key) || []), node]);
  }

  const correlations: BusinessGraphCorrelation[] = [];
  for (const [key, nodes] of grouped) {
    const businessNodeIds = Array.from(new Set(nodes.flatMap((node) => businessIdsForNode(graph, node.id))));
    if (businessNodeIds.length < 2) continue;
    const [type] = key.split(":") as [BusinessGraphCorrelationType];
    const sharedValue = nodes[0]?.normalizedValue || "unknown";
    correlations.push({
      id: `correlation:${key}`,
      type,
      sharedValue,
      nodeIds: nodes.map((node) => node.id),
      businessNodeIds,
      reason: `${businessNodeIds.length} businesses share ${sharedValue} via ${type.replace(/_/g, " ")}.`,
      evidence: nodes.flatMap((node) => node.evidence),
      confidence: confidenceFor(nodes),
    });
  }

  return correlations;
}

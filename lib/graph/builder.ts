import type { ProviderExecutionRecord } from "../providers/ProviderManager";
import { createGraphEdge, edgeKey, mapOntologyRelationship } from "./edges";
import { createGraphNodeFromOntology, createInvestigationNode, createProviderNode, stableGraphId } from "./nodes";
import type { GraphEdge, GraphNode, KnowledgeGraph } from "./types";
import type { Investigation } from "../investigation/types";

export function buildKnowledgeGraph(investigation: Investigation): KnowledgeGraph {
  const nodeBag = new Map<string, GraphNode>();
  const edgeBag = new Map<string, GraphEdge>();
  const ontologyIdToGraphId = new Map<string, string>();
  const investigationNode = createInvestigationNode(investigation);

  addNode(nodeBag, investigationNode);

  for (const entity of [...investigation.ontologyGraph.entities].sort(byId)) {
    const node = createGraphNodeFromOntology(entity);
    if (!node) continue;
    ontologyIdToGraphId.set(entity.id, node.id);
    addNode(nodeBag, node);
    addEdge(edgeBag, createGraphEdge({
      from: investigationNode.id,
      to: node.id,
      relationship: entity.type === "EvidenceItem" ? "SUPPORTED_BY" : "INVESTIGATED",
      confidence: node.confidence,
      evidenceRefs: entity.evidenceRefs,
    }));
  }

  for (const relationship of [...investigation.ontologyGraph.relationships].sort(byId)) {
    const from = ontologyIdToGraphId.get(relationship.from) ?? stableGraphId("external", relationship.from);
    const to = ontologyIdToGraphId.get(relationship.to) ?? stableGraphId("external", relationship.to);
    addEdge(edgeBag, createGraphEdge({
      from,
      to,
      relationship: mapOntologyRelationship(relationship.type),
      confidence: relationship.confidence,
      evidenceRefs: relationship.evidenceRefs,
    }));
  }

  for (const record of providerRecords(investigation).sort((a, b) => (a.providerId ?? a.engineId).localeCompare(b.providerId ?? b.engineId))) {
    const provider = createProviderNode(record.providerId ?? record.engineId, investigation.updatedAt || investigation.createdAt, providerConfidence(record));
    addNode(nodeBag, provider);
    addEdge(edgeBag, createGraphEdge({
      from: provider.id,
      to: investigationNode.id,
      relationship: "VERIFIED_BY",
      confidence: provider.confidence,
      evidenceRefs: [],
    }));
  }

  linkEvidenceToSupportedNodes(nodeBag, edgeBag);

  const nodes = [...nodeBag.values()].sort((a, b) => a.id.localeCompare(b.id));
  const edges = [...edgeBag.values()].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));

  return {
    nodes,
    edges,
    metadata: {
      investigationId: investigation.investigationId,
      generatedAt: investigation.updatedAt || investigation.createdAt,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  };
}

function linkEvidenceToSupportedNodes(nodeBag: Map<string, GraphNode>, edgeBag: Map<string, GraphEdge>): void {
  const evidenceNodes = [...nodeBag.values()].filter((node) => node.type === "EvidenceItem");
  const supportedNodes = [...nodeBag.values()].filter((node) => node.type !== "Investigation" && node.type !== "EvidenceItem" && node.evidenceRefs?.length);

  for (const evidence of evidenceNodes) {
    const evidenceRefs = evidence.evidenceRefs ?? [];
    for (const node of supportedNodes) {
      const sharedRefs = evidenceRefs.filter((ref) => node.evidenceRefs?.includes(ref));
      if (sharedRefs.length) {
        addEdge(edgeBag, createGraphEdge({ from: node.id, to: evidence.id, relationship: "SUPPORTED_BY", confidence: Math.min(node.confidence, evidence.confidence), evidenceRefs: sharedRefs }));
      }
    }
  }
}

function providerRecords(investigation: Investigation): ProviderExecutionRecord[] {
  return [
    ...investigation.technicalStatus.executed,
    ...investigation.technicalStatus.failed,
    ...investigation.technicalStatus.pending,
    ...investigation.technicalStatus.skipped,
  ];
}

function providerConfidence(record: ProviderExecutionRecord): number {
  if (record.status === "executed") return 0.8;
  if (record.status === "failed") return 0.35;
  if (record.status === "skipped") return 0.2;
  return 0.5;
}

function addNode(nodeBag: Map<string, GraphNode>, node: GraphNode): void {
  nodeBag.set(node.id, node);
}

function addEdge(edgeBag: Map<string, GraphEdge>, edge: GraphEdge): void {
  edgeBag.set(edgeKey(edge), edge);
}

function byId(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id);
}

import type { Investigation } from "../investigation/types";
import type { OntologyEntity, OntologyRelationship } from "../ontology/types";

export type GraphNodeType =
  | "BusinessIdentity"
  | "Investigation"
  | "EvidenceItem"
  | "RiskSignal"
  | "Provider"
  | "Recommendation"
  | "ObservedOutcome"
  | "MarketplaceAccount"
  | "PaymentAccount"
  | "Domain"
  | "Email"
  | "Phone";

export type GraphRelationship =
  | "INVESTIGATED"
  | "USES"
  | "OWNS"
  | "RESOLVED_TO"
  | "SUPPORTED_BY"
  | "GENERATED"
  | "RELATED_TO"
  | "OBSERVED_IN"
  | "VERIFIED_BY"
  | "LINKED_TO";

export type GraphSource = string;

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  confidence: number;
  source: GraphSource;
  createdAt: string;
  evidenceRefs?: string[];
  attributes?: Record<string, unknown>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: GraphRelationship;
  confidence: number;
  evidenceRefs: string[];
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    investigationId: string;
    generatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface GraphBuilderInput {
  investigation: Investigation;
}

export interface GraphBuildContext {
  investigation: Investigation;
  createdAt: string;
}

export type GraphEntityInput = Pick<OntologyEntity, "id" | "type" | "label" | "confidence" | "source" | "createdAt" | "evidenceRefs"> & {
  attributes?: Record<string, unknown>;
};

export type GraphRelationshipInput = Pick<OntologyRelationship, "type" | "from" | "to" | "confidence" | "evidenceRefs">;

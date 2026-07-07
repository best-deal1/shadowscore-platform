import type { BusinessProfile, BusinessProfileConfidence, EvidenceReliability } from "../businessProfileEngine/types";

export type BusinessGraphNodeType =
  | "Business"
  | "Domain"
  | "Email"
  | "Phone"
  | "Address"
  | "Marketplace"
  | "Company Registry"
  | "Payment Provider"
  | "Social Profile"
  | "Brand";

export type BusinessGraphEdgeType =
  | "owns"
  | "uses"
  | "registered_to"
  | "resolves_to"
  | "connected_to"
  | "verified_by"
  | "shares_identity_with";

export type BusinessGraphEvidence = {
  id: string;
  label: string;
  value: string;
  source: string;
};

export type BusinessGraphConfidence = BusinessProfileConfidence;
export type BusinessGraphReliability = EvidenceReliability;

export type BusinessGraphNode = {
  id: string;
  type: BusinessGraphNodeType;
  label: string;
  normalizedValue: string;
  source: string;
  confidence: BusinessGraphConfidence;
  reliability: BusinessGraphReliability;
  evidence: BusinessGraphEvidence[];
};

export type BusinessGraphEdge = {
  id: string;
  type: BusinessGraphEdgeType;
  from: string;
  to: string;
  reason: string;
  evidence: BusinessGraphEvidence[];
  confidence: BusinessGraphConfidence;
};

export type BusinessGraph = {
  engineVersion: string;
  generatedAt: string;
  nodes: BusinessGraphNode[];
  edges: BusinessGraphEdge[];
};

export type BusinessGraphInput = BusinessProfile | BusinessProfile[];

export type BusinessGraphCorrelationType =
  | "same_email"
  | "same_phone"
  | "same_address"
  | "same_domain_owner"
  | "same_marketplace_identity";

export type BusinessGraphCorrelation = {
  id: string;
  type: BusinessGraphCorrelationType;
  sharedValue: string;
  nodeIds: string[];
  businessNodeIds: string[];
  reason: string;
  evidence: BusinessGraphEvidence[];
  confidence: BusinessGraphConfidence;
};

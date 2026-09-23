import type { TrustGraphEntity, TrustGraphRelationship } from "@/lib/trustGraph";

export type IntelligenceType = "trust_explanation" | "risk_explanation" | "missing_evidence" | "conflicts" | "relationship_insights" | "change_impact" | "recommendation";
export type Severity = "low" | "medium" | "high" | "critical";
export type RecommendationType = "approve" | "approve_with_conditions" | "manual_review" | "request_additional_evidence" | "monitor" | "reject";

export type ReasoningStep = {
  id: string;
  input: string;
  source: string;
  evidenceIds: string[];
  relationshipIds: string[];
  interpretation: string;
  effect: { target: "trust" | "risk" | "confidence" | "recommendation"; direction: "positive" | "negative" | "neutral"; value?: number };
};

export type RecommendedAction = { type: string; priority: Severity; description: string; collectionTarget?: string };

export type IntelligenceResult = {
  id: string;
  entityId: string;
  intelligenceType: IntelligenceType;
  conclusion: string;
  confidence: number;
  severity?: Severity;
  evidenceIds: string[];
  relationshipIds: string[];
  affectedEntityIds: string[];
  reasoningPath: ReasoningStep[];
  recommendedActions: RecommendedAction[];
  generatedAt: string;
  engine: string;
  engineVersion: string;
  details: Record<string, unknown>;
};

export type IntelligenceGraphReader = {
  getEntity(id: string): TrustGraphEntity | undefined;
  getRelationships(entityId: string): TrustGraphRelationship[];
  getTimeline(entityId: string): Array<{ id: string; type: string; occurredAt: string; evidenceIds: string[]; reason: string; details: Record<string, unknown> }>;
  getDecisions(entityId: string): Array<{ id: string; recommendation: string; confidence: number; evidenceIds: string[]; policyVersion: string; decidedAt: string }>;
  getTrust(entityId: string): { score: number; confidence: number; evidenceIds: string[]; explanation: string; calculatedAt: string } | undefined;
};

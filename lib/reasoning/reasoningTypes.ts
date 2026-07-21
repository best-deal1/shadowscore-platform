import type { EvidenceItem, EvidenceRef } from "../evidence";
import type { CorrelationSummary } from "../correlation";
import type { ProviderResult } from "../providers/types";
import type { VerificationDecisionOutput } from "../decisionEngine/model";

export type ReasoningFactKind = "Observed Fact" | "Inferred Fact" | "Verified Fact" | "Assumption" | "Missing Evidence" | "Contradiction" | "Unknown";
export type ReasoningContribution = "positive" | "missing" | "negative" | "neutral";

export type ReasoningEvidenceReference = {
  evidenceId: string;
  provider: string;
  source: string;
  title: string;
  category: EvidenceItem["category"];
  confidence: number;
  refs: EvidenceRef[];
};

export type ReasoningStep = {
  id: string;
  kind: ReasoningFactKind;
  observation: string;
  supportingEvidence: ReasoningEvidenceReference[];
  inferredFact: string;
  confidence: number;
  assumptions: string[];
  unresolvedQuestions: string[];
  contribution: ReasoningContribution;
};

export type ReasoningContradiction = {
  id: string;
  why: string;
  conflictingEvidence: ReasoningEvidenceReference[];
  relationshipEvidenceIds: string[];
  strongerEvidence: ReasoningEvidenceReference | null;
  affectsDecision: boolean;
  explanation: string;
};

export type ReasoningEdge = { from: string; to: string; relationship: "supports" | "infers" | "contributes_to" | "conflicts_with" };
export type ReasoningNode = { id: string; label: string; kind: ReasoningFactKind | "Decision" | "Evidence" | "Provider"; confidence?: number };

export type ReasoningGraph = { nodes: ReasoningNode[]; edges: ReasoningEdge[] };

export type ReasoningSummary = {
  keyConclusions: string[];
  remainingQuestions: string[];
  decisionBasis: string[];
  confidencePropagation: string[];
};

export type ReasoningOutput = {
  engineVersion: string;
  steps: ReasoningStep[];
  contradictions: ReasoningContradiction[];
  graph: ReasoningGraph;
  summary: ReasoningSummary;
};

export type ReasoningInput = {
  evidenceItems: EvidenceItem[];
  providerResults?: ProviderResult[];
  correlationSummary?: CorrelationSummary;
  decision?: Pick<VerificationDecisionOutput, "decision" | "reasons" | "verificationConfidence" | "positiveEvidenceCount" | "missingEvidenceCount" | "negativeEvidenceCount">;
};

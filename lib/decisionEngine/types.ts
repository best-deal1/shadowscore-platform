import type { BusinessProfile, BusinessProfileContradictionSignal, BusinessProfileEvidenceItem } from "../businessProfileEngine/types";
import type { ExecutionPlan } from "../orchestrator/types";

export type DecisionIntelligenceDecision =
  | "Strong public evidence"
  | "Limited public evidence"
  | "Conflicting evidence detected"
  | "Insufficient evidence";

export type DecisionConfidenceLevel = "High" | "Medium" | "Low" | "None";

export type DecisionEvidenceCoverage = "Strong" | "Partial" | "Limited" | "Insufficient";

export type EvidenceItem = BusinessProfileEvidenceItem & {
  supports?: string[];
};

export type ContradictionSignal = BusinessProfileContradictionSignal;

export type DecisionReasoningStep = {
  evidence: string[];
  interpretation: string;
  businessMeaning: string;
  recommendation: string;
};

export type DecisionIntelligenceInput = {
  businessProfile: BusinessProfile;
  executionPlan: ExecutionPlan;
  evidenceItems: EvidenceItem[];
  contradictionSignals: ContradictionSignal[];
};

export type DecisionIntelligenceOutput = {
  decision: DecisionIntelligenceDecision;
  confidenceLevel: DecisionConfidenceLevel;
  evidenceCoverage: DecisionEvidenceCoverage;
  missingEvidence: string[];
  contradictions: ContradictionSignal[];
  reasoning: DecisionReasoningStep[];
  recommendation: string;
  nextActions: string[];
};

export type EvidenceAssessment = {
  requiredEvidenceCount: number;
  completedRequiredEvidenceCount: number;
  reliableEvidenceCount: number;
  evidenceCoverage: DecisionEvidenceCoverage;
  confidenceLevel: DecisionConfidenceLevel;
  missingEvidence: string[];
};

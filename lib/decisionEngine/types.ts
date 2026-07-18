import type { CorrelationFinding } from "../correlation";
import type { BusinessProfile, BusinessProfileContradictionSignal, BusinessProfileEvidenceItem } from "../businessProfileEngine/types";
import type { ExecutionPlan } from "../orchestrator/types";

import type { CanonicalDecision } from "../canonicalDecision";

export type DecisionIntelligenceDecision = "PASS" | "PROCEED_WITH_VERIFICATION" | "REVIEW" | "FAIL";

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
  correlationFindings?: CorrelationFinding[];
  contradictionSignals: ContradictionSignal[];
};

export type DecisionIntelligenceOutput = {
  decision: DecisionIntelligenceDecision;
  confidenceLevel: DecisionConfidenceLevel;
  evidenceCoverage: DecisionEvidenceCoverage;
  verificationConfidence: number;
  evidenceCompleteness: number;
  negativeEvidenceCount: number;
  positiveEvidenceCount: number;
  missingEvidenceCount: number;
  findings: Array<{ category: "positive" | "missing" | "negative"; confidence: number; source: string; impact: string; explanation: string }>;
  missingEvidence: string[];
  correlations: CorrelationFinding[];
  contradictions: ContradictionSignal[];
  reasoning: DecisionReasoningStep[];
  recommendation: string;
  nextActions: string[];
  canonicalDecision: CanonicalDecision;
};

export type EvidenceAssessment = {
  requiredEvidenceCount: number;
  completedRequiredEvidenceCount: number;
  reliableEvidenceCount: number;
  positiveEvidenceCount: number;
  missingEvidenceCount: number;
  negativeEvidenceCount: number;
  evidenceCompleteness: number;
  evidenceCoverage: DecisionEvidenceCoverage;
  confidenceLevel: DecisionConfidenceLevel;
  missingEvidence: string[];
};

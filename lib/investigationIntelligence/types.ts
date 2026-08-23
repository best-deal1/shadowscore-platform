import type { BusinessFinding } from "../businessIntelligence";
import type { CorrelationSummary } from "../correlation";
import type { EvidenceItem } from "../evidence";
import type { KnowledgeGraphSnapshot } from "../knowledgeGraph/types";

export type DecisionSupportOutcome = "Proceed" | "Proceed with Conditions" | "Verification Required" | "Further Investigation Required" | "Do Not Proceed";
export type EvidenceQuality = "High" | "Medium" | "Low";

export type IntelligenceContradiction = {
  id: string;
  title: string;
  severity: "medium" | "high" | "critical";
  explanation: string;
  whyItMatters: string;
  evidenceIds: string[];
};

export type IntelligenceRelationship = {
  id: string;
  type: string;
  from: string;
  to: string;
  confidence: number;
  evidenceIds: string[];
  explanation: string;
};

export type ExplainedRisk = {
  id: string;
  title: string;
  severity: "medium" | "high" | "critical";
  whyDetected: string;
  supportingEvidence: Array<{ id: string; label: string; source: string }>;
  businessImpact: string;
};

export type SectionConfidence = {
  section: "Identity" | "Relationships" | "Risk" | "Decision";
  confidence: number;
  evidenceQuality: EvidenceQuality;
  missingEvidence: string[];
};

export type EvidenceGap = { id: string; missingEvidence: string; recommendation: string; confidenceImpact: string };

export type EvidenceLifecycle = {
  observations: string[];
  discoveryCandidates: string[];
  corroboratedEvidence: string[];
  verifiedSubjectEvidence: string[];
  coverageGaps: string[];
  providerFailures: string[];
  contradictions: string[];
  adverseFindings: string[];
  counts: { observations: number; discoveryCandidates: number; corroboratedEvidence: number; verifiedFacts: number };
};

export type ExecutiveClaim = { id: string; statement: string; status: "supported" | "unresolved" | "coverage_gap"; evidenceIds: string[] };

export type InvestigationIntelligence = {
  engineVersion: string;
  generatedAt: string;
  contradictions: IntelligenceContradiction[];
  relationships: IntelligenceRelationship[];
  risks: ExplainedRisk[];
  sectionConfidence: SectionConfidence[];
  executiveInsight: string;
  evidenceGaps: EvidenceGap[];
  evidenceLifecycle: EvidenceLifecycle;
  executiveClaims: ExecutiveClaim[];
  decisionSupport: { outcome: DecisionSupportOutcome; justification: string; conditions: string[] };
};

export type InvestigationIntelligenceInput = {
  evidenceItems: EvidenceItem[];
  correlationSummary: CorrelationSummary;
  businessFindings: BusinessFinding[];
  knowledgeGraph: KnowledgeGraphSnapshot;
  generatedAt?: string;
};

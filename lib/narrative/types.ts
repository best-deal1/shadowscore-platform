import type { BusinessProfile, BusinessProfileEvidenceItem } from "../businessProfileEngine/types";
import type { BusinessMemoryResult } from "../businessMemory/types";
import type { DecisionIntelligenceOutput, EvidenceItem } from "../decisionEngine/types";
import type { DecisionOutput } from "../decisionEngine";
import type { KnowledgeGraphSnapshot } from "../knowledgeGraph/types";

export type NarrativeDecision = DecisionIntelligenceOutput | DecisionOutput;
export type NarrativeEvidence = EvidenceItem | BusinessProfileEvidenceItem;

export type BusinessNarrativeSectionId =
  | "executiveSummary"
  | "whatWeFound"
  | "whatIncreasesConfidence"
  | "whatRequiresVerification"
  | "recommendedNextSteps"
  | "decisionCost"
  | "investigationStory"
  | "evidenceUsed";

export type BusinessNarrativeSection = {
  id: BusinessNarrativeSectionId;
  title: string;
  body: string[];
};

export type BusinessNarrative = {
  generatedAt: string;
  businessName: string;
  primaryDomain: string;
  decision: string;
  confidence: string;
  decisionMode: {
    proceed: "YES" | "REVIEW" | "NO";
    decisionOutcome?: string;
    decisionLight?: string;
    riskLevel?: string;
    headline?: string;
    userMeaning?: string;
    allowedActions?: string[];
    blockedActions?: string[];
    confidence: string;
    mainRemainingUncertainty: string;
    recommendedNextAction: string;
    estimatedEffort: string;
    businessImpactIfSkipped: "Low" | "Medium" | "High";
  };
  sections: BusinessNarrativeSection[];
};

export type NarrativeInput = {
  decision: NarrativeDecision;
  evidence: NarrativeEvidence[];
  businessProfile: BusinessProfile;
  knowledgeGraph: KnowledgeGraphSnapshot;
  businessMemory?: BusinessMemoryResult;
  generatedAt?: string;
};

export type NarrativeFacts = {
  businessName: string;
  primaryDomain: string;
  businessType: string;
  decision: string;
  confidence: string;
  coverage: string;
  recommendation: string;
  nextActions: string[];
  positiveFindings: string[];
  verificationNeeds: string[];
  evidenceUsed: string[];
  relationshipCount: number;
  entityCount: number;
  stabilitySummary?: string;
  hasContradictions: boolean;
  proceed: "YES" | "REVIEW" | "NO";
  decisionOutcome?: string;
  decisionLight?: string;
  riskLevel?: string;
  headline?: string;
  userMeaning?: string;
  allowedActions?: string[];
  blockedActions?: string[];
  mainRemainingUncertainty: string;
  estimatedEffort: string;
  businessImpactIfSkipped: "Low" | "Medium" | "High";
};

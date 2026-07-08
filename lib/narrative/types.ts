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
};

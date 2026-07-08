import type { DecisionEvidenceCoverage, DecisionConfidenceLevel, EvidenceAssessment, EvidenceItem } from "./types";
import type { BusinessProfile } from "../businessProfileEngine/types";
import type { ExecutionPlan } from "../orchestrator/types";

const ENGINE_EVIDENCE_LABELS: Record<string, string> = {
  dns: "DNS infrastructure evidence",
  whois: "Domain registration evidence",
  ssl: "SSL certificate evidence",
  headers: "Website security header evidence",
  "business-profile": "Business identity evidence",
  marketplace: "Marketplace verification evidence",
  reputation: "Public reputation evidence",
  graph: "Business relationship evidence",
  "email-intelligence": "Business email evidence",
  domain: "Domain control evidence",
  "evidence-parser": "Parsed public evidence",
  "contradiction-engine": "Contradiction review evidence",
};

function isReliable(item: EvidenceItem) {
  return item.reliability === "Very High" || item.reliability === "High" || item.reliabilityWeight >= 70;
}

function coverageFrom(completed: number, required: number, reliable: number): DecisionEvidenceCoverage {
  if (required === 0 || completed === 0) return "Insufficient";
  const ratio = completed / required;
  if (ratio >= 0.8 && reliable >= 3) return "Strong";
  if (ratio >= 0.5 && reliable >= 2) return "Partial";
  if (completed > 0) return "Limited";
  return "Insufficient";
}

function confidenceFrom(coverage: DecisionEvidenceCoverage): DecisionConfidenceLevel {
  if (coverage === "Strong") return "High";
  if (coverage === "Partial") return "Medium";
  if (coverage === "Limited") return "Low";
  return "None";
}

export function assessEvidence(input: { businessProfile: BusinessProfile; executionPlan: ExecutionPlan; evidenceItems: EvidenceItem[] }): EvidenceAssessment {
  const requiredSteps = input.executionPlan.executionPlan.filter((step) => step.required);
  const requiredLabels = requiredSteps.map((step) => ENGINE_EVIDENCE_LABELS[step.engineId] ?? `${step.label} evidence`);
  const profileMissing = input.businessProfile.missingEvidence.filter((item) => item.trim().length > 0);
  const availableText = input.evidenceItems.map((item) => `${item.type} ${item.label} ${item.source} ${item.value}`.toLowerCase());
  const missingFromPlan = requiredSteps
    .filter((step) => {
      const id = step.engineId.toLowerCase();
      return !availableText.some((text) => text.includes(id) || text.includes(step.label.toLowerCase()));
    })
    .map((step) => ENGINE_EVIDENCE_LABELS[step.engineId] ?? `${step.label} evidence`);
  const missingEvidence = Array.from(new Set([...profileMissing, ...missingFromPlan, ...requiredLabels.filter((label) => input.evidenceItems.length === 0 && label)]));
  const reliableEvidenceCount = input.evidenceItems.filter(isReliable).length;
  const completedRequiredEvidenceCount = Math.max(0, requiredSteps.length - missingFromPlan.length);
  const requiredEvidenceCount = Math.max(requiredSteps.length, 1);
  const evidenceCoverage = coverageFrom(completedRequiredEvidenceCount, requiredEvidenceCount, reliableEvidenceCount);

  return {
    requiredEvidenceCount,
    completedRequiredEvidenceCount,
    reliableEvidenceCount,
    evidenceCoverage,
    confidenceLevel: confidenceFrom(evidenceCoverage),
    missingEvidence,
  };
}

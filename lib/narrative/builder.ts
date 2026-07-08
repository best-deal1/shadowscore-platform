import { buildNarrativeSections } from "./sections";
import type { BusinessNarrative, NarrativeDecision, NarrativeEvidence, NarrativeFacts, NarrativeInput } from "./types";

function hasDecisionIntelligenceShape(decision: NarrativeDecision): decision is Extract<NarrativeDecision, { decision: string }> {
  return "decision" in decision;
}

function decisionLabel(decision: NarrativeDecision) {
  return hasDecisionIntelligenceShape(decision) ? decision.decision : decision.decisionLabel;
}

function confidenceLabel(decision: NarrativeDecision) {
  return hasDecisionIntelligenceShape(decision) ? decision.confidenceLevel : decision.confidenceLevel;
}

function coverageLabel(input: NarrativeInput) {
  if (hasDecisionIntelligenceShape(input.decision)) return input.decision.evidenceCoverage;
  return input.businessProfile.investigationCoverage;
}

function recommendation(input: NarrativeInput) {
  if (hasDecisionIntelligenceShape(input.decision)) return input.decision.recommendation;
  return input.decision.recommendedAction;
}

function nextActions(input: NarrativeInput) {
  if (hasDecisionIntelligenceShape(input.decision)) return input.decision.nextActions;
  return [input.decision.recommendedAction];
}

function evidenceLabel(item: NarrativeEvidence) {
  const source = item.source ? ` from ${item.source}` : "";
  return `${item.label}${source}`;
}

function businessFriendlyEvidence(item: NarrativeEvidence) {
  switch (item.type) {
    case "dns":
      return "The business has a functioning public web presence.";
    case "email_authentication":
      return "Professional email protections are visible for the domain.";
    case "ssl":
      return "The public website supports secure visitor connections.";
    case "whois":
      return "Domain registration context is available for review.";
    case "business_website":
      return "A public website is available for customers or partners to inspect.";
    case "marketplace_verification":
      return "Marketplace information provides an additional public business signal.";
    case "government_registry":
    case "official_business_registry":
      return "Official registry information supports the business identity.";
    default:
      return item.confidence === "High" || item.reliability === "High" || item.reliability === "Very High"
        ? `${item.label} supports the business profile.`
        : `${item.label} adds context but should not be treated as final proof on its own.`;
  }
}

function missingEvidence(input: NarrativeInput) {
  const decisionMissing = hasDecisionIntelligenceShape(input.decision) ? input.decision.missingEvidence : [];
  return Array.from(new Set([...input.businessProfile.missingEvidence, ...decisionMissing, ...input.businessProfile.warningSignals]));
}

function buildFacts(input: NarrativeInput): NarrativeFacts {
  const positiveFindings = Array.from(new Set([
    ...input.businessProfile.trustSignals,
    ...input.evidence.filter((item) => item.reliabilityWeight >= 60 || item.confidence === "High").map(businessFriendlyEvidence),
  ])).filter(Boolean);

  return {
    businessName: input.businessProfile.businessName || input.businessProfile.primaryDomain || "The business",
    primaryDomain: input.businessProfile.primaryDomain || "the reviewed domain",
    businessType: input.businessProfile.businessType,
    decision: decisionLabel(input.decision),
    confidence: confidenceLabel(input.decision),
    coverage: coverageLabel(input),
    recommendation: recommendation(input),
    nextActions: nextActions(input),
    positiveFindings,
    verificationNeeds: missingEvidence(input),
    evidenceUsed: input.evidence.map(evidenceLabel),
    relationshipCount: input.knowledgeGraph.graphSummary.relationshipCount,
    entityCount: input.knowledgeGraph.graphSummary.entityCount,
    stabilitySummary: input.businessMemory?.changeSummary,
    hasContradictions: input.businessProfile.contradictionSignals.length > 0 || (hasDecisionIntelligenceShape(input.decision) && input.decision.contradictions.length > 0),
  };
}

export function buildBusinessNarrative(input: NarrativeInput): BusinessNarrative {
  const facts = buildFacts(input);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    businessName: facts.businessName,
    primaryDomain: facts.primaryDomain,
    decision: facts.decision,
    confidence: facts.confidence,
    sections: buildNarrativeSections(facts),
  };
}

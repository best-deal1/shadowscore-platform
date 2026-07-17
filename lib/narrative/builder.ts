import { buildNarrativeSections } from "./sections";
import type { BusinessNarrative, NarrativeDecision, NarrativeEvidence, NarrativeFacts, NarrativeInput } from "./types";

function hasDecisionIntelligenceShape(decision: NarrativeDecision): decision is Extract<NarrativeDecision, { recommendation: string }> {
  return "recommendation" in decision;
}

function decisionLabel(decision: NarrativeDecision) {
  const canonical = hasDecisionIntelligenceShape(decision) ? decision.canonicalDecision : decision.canonicalDecision;
  return canonical?.headline || (hasDecisionIntelligenceShape(decision) ? decision.decision : `${decision.decision}: ${decision.decisionLabel}`);
}

function confidenceLabel(decision: NarrativeDecision) {
  return hasDecisionIntelligenceShape(decision) ? decision.confidenceLevel : decision.confidenceLevel;
}

function coverageLabel(input: NarrativeInput) {
  if (hasDecisionIntelligenceShape(input.decision)) return input.decision.evidenceCoverage;
  return input.decision.confidenceLevel || "Unknown";
}

function recommendation(input: NarrativeInput) {
  const canonical = hasDecisionIntelligenceShape(input.decision) ? input.decision.canonicalDecision : input.decision.canonicalDecision;
  if (canonical) return canonical.userMeaning;
  if (hasDecisionIntelligenceShape(input.decision)) return input.decision.recommendation;
  return input.decision.recommendedAction;
}

function nextActions(input: NarrativeInput) {
  const canonical = hasDecisionIntelligenceShape(input.decision) ? input.decision.canonicalDecision : input.decision.canonicalDecision;
  if (canonical) return [...canonical.allowedActions.map((item) => `Allowed: ${item}.`), ...canonical.blockedActions.map((item) => `Blocked until verification: ${item}.`)];
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
      return "Business email authenticity can be independently checked for the domain.";
    case "ssl":
      return "The public website supports secure visitor connections.";
    case "whois":
      return "Domain registration context is available for ownership review.";
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
  const decisionMissing = hasDecisionIntelligenceShape(input.decision) ? input.decision.missingEvidence : input.decision.missingSignals;
  return Array.from(new Set([...input.businessProfile.missingEvidence, ...decisionMissing, ...input.businessProfile.warningSignals]));
}

function proceedLabel(decision: NarrativeDecision): "YES" | "REVIEW" | "NO" {
  const canonical = hasDecisionIntelligenceShape(decision) ? decision.canonicalDecision : decision.canonicalDecision;
  if (canonical?.decisionOutcome === "PROCEED") return "YES";
  if (canonical?.decisionOutcome === "DO_NOT_PROCEED") return "NO";
  return "REVIEW";
}

function uncertaintyLabel(verificationNeeds: string[]) {
  const first = verificationNeeds[0];
  if (!first) return "Routine documentation";
  const normalized = first.toLowerCase();
  if (normalized.includes("owner") || normalized.includes("identity") || normalized.includes("registration")) return "Business ownership";
  if (normalized.includes("payment") || normalized.includes("bank") || normalized.includes("payout")) return "Payment identity";
  if (normalized.includes("email")) return "Business email authenticity";
  if (normalized.includes("domain") || normalized.includes("website")) return "Website ownership";
  return first;
}

function effortLabel(verificationNeeds: string[]) {
  return verificationNeeds.length > 2 ? "10 minutes" : verificationNeeds.length > 0 ? "3 minutes" : "2 minutes";
}

function impactLabel(proceed: "YES" | "REVIEW" | "NO", verificationNeeds: string[]): "Low" | "Medium" | "High" {
  if (proceed === "NO") return "High";
  if (proceed === "REVIEW" || verificationNeeds.length > 1) return "Medium";
  return "Low";
}

function buildFacts(input: NarrativeInput): NarrativeFacts {
  const positiveFindings = Array.from(new Set([
    ...input.businessProfile.trustSignals,
    ...input.evidence.filter((item) => item.reliabilityWeight >= 60 || item.confidence === "High").map(businessFriendlyEvidence),
  ])).filter(Boolean);

  const verificationNeeds = missingEvidence(input);
  const proceed = proceedLabel(input.decision);
  const canonical = hasDecisionIntelligenceShape(input.decision) ? input.decision.canonicalDecision : input.decision.canonicalDecision;

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
    verificationNeeds,
    evidenceUsed: input.evidence.map(evidenceLabel),
    relationshipCount: input.knowledgeGraph.graphSummary.relationshipCount,
    entityCount: input.knowledgeGraph.graphSummary.entityCount,
    stabilitySummary: input.businessMemory?.changeSummary,
    hasContradictions: input.businessProfile.contradictionSignals.length > 0 || (hasDecisionIntelligenceShape(input.decision) ? input.decision.contradictions.length > 0 : false),
    proceed,
    decisionOutcome: canonical?.decisionOutcome,
    decisionLight: canonical?.decisionLight,
    riskLevel: canonical?.riskLevel,
    headline: canonical?.headline,
    userMeaning: canonical?.userMeaning,
    allowedActions: canonical?.allowedActions,
    blockedActions: canonical?.blockedActions,
    mainRemainingUncertainty: uncertaintyLabel(verificationNeeds),
    estimatedEffort: effortLabel(verificationNeeds),
    businessImpactIfSkipped: impactLabel(proceed, verificationNeeds),
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
    decisionMode: {
      proceed: facts.proceed,
      confidence: facts.confidence,
      mainRemainingUncertainty: facts.mainRemainingUncertainty,
      recommendedNextAction: facts.recommendation,
      estimatedEffort: facts.estimatedEffort,
      businessImpactIfSkipped: facts.businessImpactIfSkipped,
      decisionOutcome: facts.decisionOutcome,
      decisionLight: facts.decisionLight,
      riskLevel: facts.riskLevel,
      headline: facts.headline,
      userMeaning: facts.userMeaning,
      allowedActions: facts.allowedActions,
      blockedActions: facts.blockedActions,
    },
    sections: buildNarrativeSections(facts),
  };
}

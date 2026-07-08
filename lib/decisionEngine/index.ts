export * from "./types";
export { evaluateDecisionEvidence } from "./evaluator";
import type { TrustInsight } from "../insightEngine";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput, RiskSeverity } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";

export const DECISION_ENGINE_VERSION = "decision-engine-v1";

export type DecisionLabel = "Safe to proceed" | "Proceed with verification" | "High caution";
export type DecisionConfidence = "Low" | "Medium" | "High";
export type DecisionAudience = "free" | "paid";

export type DecisionOutput = {
  engineVersion: string;
  generatedAt: string;
  audience: DecisionAudience;
  decisionLabel: DecisionLabel;
  confidenceLevel: DecisionConfidence;
  topReasons: string[];
  whatThisMeans: string;
  recommendedAction: string;
  limitedPreview: boolean;
};

function provider(id: string, providerResults: ProviderResult[]) {
  return providerResults.find((result) => result.providerId === id);
}

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function highRiskFinding(severity: RiskSeverity) {
  return severity === "High" || severity === "Critical";
}

function uniqueFirstThree(reasons: string[]) {
  return Array.from(new Set(reasons.filter(Boolean))).slice(0, 3);
}

function confidenceFromEvidence(input: {
  providerResults: ProviderResult[];
  insights: TrustInsight[];
  timeline: TrustTimelineItem[];
  riskOutput?: RiskEngineOutput;
}): DecisionConfidence {
  const completedProviders = input.providerResults.filter((result) => result.status === "completed").length;
  const insightEvidence = input.insights.filter((insight) => insight.evidence.length > 0).length;
  const completedTimeline = input.timeline.filter((item) => item.status === "completed").length;
  const riskConfidence = input.riskOutput?.confidence ?? 0;

  if (completedProviders >= 2 && insightEvidence >= 2 && completedTimeline >= 3 && riskConfidence >= 60) return "High";
  if (completedProviders >= 1 && (insightEvidence >= 1 || completedTimeline >= 1)) return "Medium";
  return "Low";
}

export function buildDecision(input: {
  providerResults?: ProviderResult[];
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: DecisionAudience;
}): DecisionOutput {
  const providerResults = input.providerResults || [];
  const insights = input.insights || [];
  const timeline = input.timeline || [];
  const dns = provider("dns", providerResults);
  const whois = provider("whois", providerResults);
  const a = records(dns, "A");
  const ns = records(dns, "NS");
  const mx = records(dns, "MX");
  const txt = records(dns, "TXT");
  const hasDnsInfrastructure = dns?.status === "completed" && (a.length > 0 || ns.length > 0);
  const hasBusinessEmail = dns?.status === "completed" && mx.length > 0;
  const hasEmailAuthentication = txt.some((record) => record.toLowerCase().includes("v=spf1") || record.toLowerCase().includes("v=dmarc1"));
  const hasOwnershipContext = whois?.status === "completed" && (typeof whois.metadata.registrationDate === "string" || typeof whois.metadata.ageDays === "number");
  const highInsight = insights.some((insight) => insight.riskLevel === "High");
  const unknownIdentity = insights.some((insight) => insight.category === "Identity Insight" && insight.riskLevel === "Unknown");
  const highRisk = input.riskOutput?.findings.some((finding) => highRiskFinding(finding.severity)) || input.riskOutput?.stage === "Restricted" || input.riskOutput?.stage === "Suspended" || input.riskOutput?.stage === "Critical";

  let decisionLabel: DecisionLabel = "Proceed with verification";
  if (highRisk || highInsight || (!hasDnsInfrastructure && !hasBusinessEmail)) {
    decisionLabel = "High caution";
  } else if (hasDnsInfrastructure && hasBusinessEmail && hasOwnershipContext && hasEmailAuthentication && input.riskOutput && input.riskOutput.findings.length === 0) {
    decisionLabel = "Safe to proceed";
  }

  const reasons = uniqueFirstThree([
    hasDnsInfrastructure ? "DNS infrastructure is visible." : "DNS infrastructure is not fully visible from the available provider evidence.",
    hasBusinessEmail ? "Business email routing is configured." : "Business email routing was not detected in the available DNS evidence.",
    hasOwnershipContext ? "Public registration context is available." : unknownIdentity ? "Ownership data is unavailable from the available public lookup." : "Ownership context is limited in the current evidence.",
    highRisk ? "Risk Engine findings indicate elevated business caution." : "No elevated Risk Engine finding is shown in the available evidence.",
  ]);

  const whatThisMeans = decisionLabel === "Safe to proceed"
    ? "The available provider, risk, insight and timeline evidence supports normal next steps, while still keeping routine business verification in place."
    : decisionLabel === "Proceed with verification"
      ? "The target has some usable trust signals, but the evidence is not complete enough to treat it as fully validated."
      : "The available evidence is incomplete or contains elevated caution signals, so the user should avoid relying on this target without stronger verification.";

  const recommendedAction = decisionLabel === "Safe to proceed"
    ? "Proceed with normal business steps and keep identity, email and transaction records documented."
    : decisionLabel === "Proceed with verification"
      ? "Verify business identity before placing a large order, releasing funds or depending on the account for critical operations."
      : "Pause high-value activity until business identity, domain control and supporting evidence are verified.";

  return {
    engineVersion: DECISION_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    audience: input.audience,
    decisionLabel,
    confidenceLevel: confidenceFromEvidence({ providerResults, insights, timeline, riskOutput: input.riskOutput }),
    topReasons: reasons,
    whatThisMeans,
    recommendedAction,
    limitedPreview: input.audience === "free",
  };
}

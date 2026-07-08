import type { TrustInsight } from "../insightEngine";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput, RiskSeverity } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";

export type VerificationDecision = "PASS" | "REVIEW" | "FAIL";
export type DecisionColor = "green" | "orange" | "red";
export type ReputationScore = number | "pending";

export type VerificationDecisionOutput = {
  decision: VerificationDecision;
  decisionLabel: "Verified enough to proceed" | "Additional verification recommended" | "Do not proceed";
  decisionColor: DecisionColor;
  verificationScore: number;
  identityScore: number;
  infrastructureScore: number;
  emailSecurityScore: number;
  reputationScore: ReputationScore;
  evidenceCoverageScore: number;
  confidenceScore: number;
  reasons: string[];
  missingSignals: string[];
  blockingIssues: string[];
  recommendedAction: string;
  limitedPreview: boolean;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function provider(id: string, providerResults: ProviderResult[]) {
  return providerResults.find((result) => result.providerId === id);
}

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function hasRiskSeverity(output: RiskEngineOutput | undefined, severities: RiskSeverity[]) {
  return Boolean(output?.findings.some((finding) => severities.includes(finding.severity)));
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

export function buildVerificationDecision(input: {
  providerResults?: ProviderResult[];
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: "free" | "paid";
}): VerificationDecisionOutput {
  const providerResults = input.providerResults || [];
  const insights = input.insights || [];
  const timeline = input.timeline || [];
  const dns = provider("dns", providerResults);
  const whois = provider("whois", providerResults);
  const reputation = provider("reputation", providerResults);
  const marketplace = provider("marketplace", providerResults);
  const a = records(dns, "A");
  const ns = records(dns, "NS");
  const mx = records(dns, "MX");
  const txt = records(dns, "TXT");
  const hasDnsInfrastructure = dns?.status === "completed" && (a.length > 0 || ns.length > 0);
  const hasEmailRouting = dns?.status === "completed" && mx.length > 0;
  const hasSpf = txt.some((record) => record.toLowerCase().includes("v=spf1"));
  const hasDmarc = txt.some((record) => record.toLowerCase().includes("v=dmarc1"));
  const hasRegistrationContext = whois?.status === "completed" && (typeof whois.metadata.registrationDate === "string" || typeof whois.metadata.ageDays === "number");
  const hasMarketplaceEvidence = marketplace?.status === "completed" && (marketplace.evidence.length > 0 || marketplace.findings.length > 0);
  const completedProviders = providerResults.filter((result) => result.status === "completed").length;
  const attemptedProviders = providerResults.length;
  const highProviderFindings = providerResults.flatMap((result) => result.findings).filter((finding) => finding.severity === "high" || finding.severity === "critical");
  const highInsight = insights.some((insight) => insight.riskLevel === "High");
  const highRisk = hasRiskSeverity(input.riskOutput, ["High", "Critical"]);
  const failedCriticalChecks = providerResults.some((result) => ["dns", "whois"].includes(result.providerId) && result.status === "failed");
  const knownReputationIssue = reputation?.findings.some((finding) => finding.severity === "high" || finding.severity === "critical") || input.riskOutput?.primaryRiskDomain === "Reputation Risk" && highRisk;
  const hasContradiction = highProviderFindings.length > 0 || highInsight || highRisk;

  const infrastructureScore = clamp((hasDnsInfrastructure ? 55 : 0) + (ns.length > 0 ? 25 : 0) + (a.length > 0 ? 20 : 0));
  const emailSecurityScore = clamp((hasEmailRouting ? 40 : 0) + (hasSpf ? 30 : 0) + (hasDmarc ? 30 : 0));
  const identityScore = clamp((hasRegistrationContext ? 55 : 0) + (hasMarketplaceEvidence ? 25 : 0) + (insights.some((insight) => insight.category === "Identity Insight" && insight.riskLevel !== "Unknown") ? 20 : 0));
  const reputationScore: ReputationScore = reputation?.status === "completed" || input.riskOutput ? clamp(100 - (knownReputationIssue ? 70 : highRisk ? 45 : 0) - (highInsight ? 20 : 0)) : "pending";
  const evidenceCoverageScore = clamp((attemptedProviders > 0 ? (completedProviders / attemptedProviders) * 70 : 0) + (timeline.filter((item) => item.status === "completed").length >= 3 ? 15 : 0) + (insights.filter((insight) => insight.evidence.length > 0).length >= 2 ? 15 : 0));
  const confidenceScore = clamp((identityScore * 0.25) + (infrastructureScore * 0.25) + (emailSecurityScore * 0.2) + (evidenceCoverageScore * 0.2) + ((reputationScore === "pending" ? 45 : reputationScore) * 0.1));
  const verificationScore = clamp((identityScore * 0.25) + (infrastructureScore * 0.25) + (emailSecurityScore * 0.2) + ((reputationScore === "pending" ? 50 : reputationScore) * 0.15) + (evidenceCoverageScore * 0.15) - (hasContradiction ? 35 : 0) - (failedCriticalChecks ? 25 : 0));

  const missingSignals = unique([
    !hasRegistrationContext ? "business ownership or registry evidence" : "",
    reputationScore === "pending" ? "reputation evidence" : "",
    !hasEmailRouting ? "business email routing" : "",
    !hasSpf || !hasDmarc ? "email authentication" : "",
    !hasDnsInfrastructure ? "domain infrastructure" : "",
  ]);
  const blockingIssues = unique([
    hasContradiction ? "high severity contradiction or elevated risk finding" : "",
    failedCriticalChecks ? "critical provider check failed" : "",
    knownReputationIssue ? "known reputation issue" : "",
  ]);

  let decision: VerificationDecision = "REVIEW";
  if (blockingIssues.length > 0 || verificationScore < 40) decision = "FAIL";
  else if (!hasContradiction && infrastructureScore >= 70 && (hasEmailRouting || hasSpf || hasDmarc) && identityScore >= 40 && reputationScore !== "pending" && verificationScore >= 70) decision = "PASS";

  const decisionLabel = decision === "PASS" ? "Verified enough to proceed" : decision === "REVIEW" ? "Additional verification recommended" : "Do not proceed";
  const decisionColor = decision === "PASS" ? "green" : decision === "REVIEW" ? "orange" : "red";
  const reasons = unique([
    `Infrastructure score is ${infrastructureScore}/100 based on DNS and nameserver evidence.`,
    `Email security score is ${emailSecurityScore}/100 based on MX, SPF and DMARC evidence.`,
    `Identity score is ${identityScore}/100 based on ownership, registry or marketplace evidence.`,
    reputationScore === "pending" ? "Reputation evidence is pending." : `Reputation score is ${reputationScore}/100.`,
    ...blockingIssues.map((issue) => `Blocking issue: ${issue}.`),
  ]);

  return {
    decision,
    decisionLabel,
    decisionColor,
    verificationScore,
    identityScore,
    infrastructureScore,
    emailSecurityScore,
    reputationScore,
    evidenceCoverageScore,
    confidenceScore,
    reasons,
    missingSignals,
    blockingIssues,
    recommendedAction: decision === "PASS" ? "Proceed with normal business steps while keeping identity, email and transaction records documented." : decision === "REVIEW" ? "Request the missing ownership, registry or reputation evidence before a high-value transaction or account dependency." : "Pause high-value activity until blocking issues are resolved and the scan is rerun.",
    limitedPreview: input.audience === "free",
  };
}

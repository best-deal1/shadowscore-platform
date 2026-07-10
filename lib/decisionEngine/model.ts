import type { TrustInsight } from "../insightEngine";
import type { EvidenceItem } from "../evidence";
import { buildEvidenceItems } from "../evidence";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput, RiskSeverity } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";

export type VerificationDecision = "PASS" | "REVIEW" | "FAIL";
export type DecisionColor = "green" | "orange" | "red";
export type ReputationScore = number | "pending";
export type DecisionFindingCategory = "positive" | "missing" | "negative";

export type DecisionFinding = {
  category: DecisionFindingCategory;
  confidence: number;
  source: string;
  impact: string;
  explanation: string;
};

export type VerificationDecisionOutput = {
  decision: VerificationDecision;
  decisionLabel: "Verified enough to proceed" | "Additional verification recommended" | "Do not proceed";
  decisionColor: DecisionColor;
  verificationScore: number;
  verificationConfidence: number;
  identityScore: number;
  infrastructureScore: number;
  emailSecurityScore: number;
  reputationScore: ReputationScore;
  evidenceCoverageScore: number;
  evidenceCompleteness: number;
  confidenceScore: number;
  negativeEvidenceCount: number;
  positiveEvidenceCount: number;
  missingEvidenceCount: number;
  findings: DecisionFinding[];
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
  evidenceItems?: EvidenceItem[];
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: "free" | "paid";
}): VerificationDecisionOutput {
  const providerResults = input.providerResults || [];
  const evidenceItems = input.evidenceItems || buildEvidenceItems(providerResults);
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

  const negativeFindings = evidenceItems.filter((item) => item.category === "Negative").map((item) => ({
    category: "negative" as const,
    confidence: item.confidence,
    source: item.provider,
    impact: item.title,
    explanation: item.businessImpact,
  }));

  const highRisk = hasRiskSeverity(input.riskOutput, ["High", "Critical"]);
  const infrastructureScore = clamp((hasDnsInfrastructure ? 55 : 0) + (ns.length > 0 ? 25 : 0) + (a.length > 0 ? 20 : 0));
  const emailSecurityScore = clamp((hasEmailRouting ? 40 : 0) + (hasSpf ? 30 : 0) + (hasDmarc ? 30 : 0));
  const identityScore = clamp((hasRegistrationContext ? 65 : 0) + (hasMarketplaceEvidence ? 25 : 0) + (insights.some((insight) => insight.category === "Identity Insight" && insight.riskLevel !== "Unknown") ? 10 : 0));
  const knownReputationIssue = negativeFindings.some((finding) => finding.source.toLowerCase().includes("reputation") || finding.impact.toLowerCase().includes("reputation"));
  const reputationScore: ReputationScore = reputation?.status === "completed" || input.riskOutput ? clamp(100 - (knownReputationIssue ? 70 : highRisk ? 20 : 0)) : "pending";
  const providerCompleteness = attemptedProviders > 0 ? (completedProviders / attemptedProviders) * 70 : 0;
  const supportingCompleteness = (timeline.filter((item) => item.status === "completed").length >= 3 ? 15 : 0) + (insights.filter((insight) => insight.evidence.length > 0).length >= 2 ? 15 : 0);
  const evidenceCompleteness = clamp(providerCompleteness + supportingCompleteness);
  const evidenceCoverageScore = evidenceCompleteness;
  const verificationConfidence = clamp((identityScore * 0.25) + (infrastructureScore * 0.25) + (emailSecurityScore * 0.2) + (evidenceCompleteness * 0.2) + ((reputationScore === "pending" ? 50 : reputationScore) * 0.1));
  const confidenceScore = verificationConfidence;
  const verificationScore = clamp((identityScore * 0.3) + (infrastructureScore * 0.3) + (emailSecurityScore * 0.2) + ((reputationScore === "pending" ? 50 : reputationScore) * 0.2));

  const positiveFindings: DecisionFinding[] = evidenceItems.filter((item) => item.category === "Verified").map((item) => ({
    category: "positive",
    confidence: item.confidence,
    source: item.provider,
    impact: item.title,
    explanation: item.businessImpact,
  }));

  const missingFindings: DecisionFinding[] = evidenceItems.filter((item) => item.category === "Missing" || item.category === "Unavailable" || item.category === "Not Checked").map((item) => ({
    category: "missing",
    confidence: item.confidence,
    source: item.provider,
    impact: item.title,
    explanation: item.businessImpact,
  }));

  const missingSignals = unique(missingFindings.map((finding) => finding.impact));
  const blockingIssues = unique(negativeFindings.map((finding) => finding.impact));
  const positiveEvidenceCount = positiveFindings.length;
  const missingEvidenceCount = missingFindings.length;
  const negativeEvidenceCount = negativeFindings.length;

  let decision: VerificationDecision = "REVIEW";
  if (negativeEvidenceCount > 0) decision = "FAIL";
  else if (positiveEvidenceCount >= 3 && infrastructureScore >= 70 && identityScore >= 60 && verificationConfidence >= 65) decision = "PASS";

  const decisionLabel = decision === "PASS" ? "Verified enough to proceed" : decision === "REVIEW" ? "Additional verification recommended" : "Do not proceed";
  const decisionColor = decision === "PASS" ? "green" : decision === "REVIEW" ? "orange" : "red";
  const reasons = unique([
    `Positive evidence count is ${positiveEvidenceCount}.`,
    `Missing evidence count is ${missingEvidenceCount}; missing evidence does not count as risk.`,
    `Negative evidence count is ${negativeEvidenceCount}.`,
    `Verification confidence is ${verificationConfidence}/100 and evidence completeness is ${evidenceCompleteness}/100.`,
    ...blockingIssues.map((issue) => `Verified negative issue: ${issue}.`),
  ]);

  return {
    decision,
    decisionLabel,
    decisionColor,
    verificationScore,
    verificationConfidence,
    identityScore,
    infrastructureScore,
    emailSecurityScore,
    reputationScore,
    evidenceCoverageScore,
    evidenceCompleteness,
    confidenceScore,
    negativeEvidenceCount,
    positiveEvidenceCount,
    missingEvidenceCount,
    findings: [...positiveFindings, ...missingFindings, ...negativeFindings],
    reasons,
    missingSignals,
    blockingIssues,
    recommendedAction: decision === "PASS"
      ? "Sufficient evidence was collected and no significant negative indicators were detected."
      : decision === "REVIEW"
        ? "Additional verification is recommended because public evidence is incomplete. No confirmed negative indicators were detected."
        : "Confirmed negative indicators require investigation before proceeding.",
    limitedPreview: input.audience === "free",
  };
}

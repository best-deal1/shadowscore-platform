import type { TrustInsight } from "../insightEngine";
import type { EvidenceItem } from "../evidence";
import { correlateEvidence } from "../correlation";
import type { CorrelationSummary } from "../correlation";
import { buildEvidenceItems } from "../evidence";
import { isConfirmedRiskCorrelation, isConfirmedRiskEvidenceItem } from "./riskPolicy";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";
import { buildCanonicalDecision, decisionDisplayLabel, type CanonicalDecision } from "../canonicalDecision";

export type VerificationDecision = "PASS" | "PROCEED_WITH_VERIFICATION" | "REVIEW" | "FAIL";
export type DecisionColor = "green" | "yellow" | "orange" | "red";
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
  decisionLabel: "Verified enough to proceed" | "Proceed with verification" | "Review required" | "Do not proceed";
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
  canonicalDecision: CanonicalDecision;
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

function unique(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

function isApplicableEvidence(item: EvidenceItem, targetType: string) {
  const providerId = item.provider.toLowerCase();
  const title = item.title.toLowerCase();
  const isWebsite = targetType === "website" || targetType === "business" || targetType === "Website" || targetType === "Business";
  if (isWebsite && ["marketplace", "payment", "compliance"].includes(providerId)) return false;
  if (isWebsite && /(marketplace|seller-to-company|payout|payment processor|compliance authority|regulatory relationship)/i.test(title)) return false;
  if ((item.category === "Missing" || item.category === "Unavailable" || item.category === "Not Checked") && /\b(aaaa|cname) records?\b/i.test(item.title)) return false;
  if ((item.category === "Missing" || item.category === "Unavailable") && /http header/i.test(item.title)) return false;
  return item.category !== "Not Applicable";
}

function gapKey(title: string) {
  return title.toLowerCase().replace(/\s+missing$/, "").replace(/\s+record$/, " record").replace(/ provider (not checked|unavailable|availability)$/, " provider").trim();
}

function dedupeEvidence(items: EvidenceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.provider}:${item.category}:${gapKey(item.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildVerificationDecision(input: {
  providerResults?: ProviderResult[];
  evidenceItems?: EvidenceItem[];
  correlationSummary?: CorrelationSummary;
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: "free" | "paid";
  targetType?: string;
}): VerificationDecisionOutput {
  const providerResults = input.providerResults || [];
  const rawEvidenceItems = input.evidenceItems || buildEvidenceItems(providerResults);
  const targetType = input.targetType || "website";
  const applicableEvidenceItems = rawEvidenceItems.filter((item) => isApplicableEvidence(item, targetType));
  const evidenceItems = dedupeEvidence(applicableEvidenceItems);
  const correlationSummary = input.correlationSummary || correlateEvidence({ evidenceItems, targetType });
  const correlationContradictions = correlationSummary.contradictions;
  const insights = input.insights || [];
  const timeline = input.timeline || [];
  const dns = provider("dns", providerResults);
  const whois = provider("whois", providerResults);
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

  const confirmedRiskEvidenceItems = evidenceItems.filter(isConfirmedRiskEvidenceItem);
  const reviewOnlyNegativeEvidenceItems = evidenceItems.filter((item) => item.category === "Negative" && !isConfirmedRiskEvidenceItem(item));

  const negativeFindings = confirmedRiskEvidenceItems.map((item) => ({
    category: "negative" as const,
    confidence: item.confidence,
    source: item.provider,
    impact: item.title,
    explanation: item.businessImpact,
  }));

  const infrastructureScore = clamp((hasDnsInfrastructure ? 55 : 0) + (ns.length > 0 ? 25 : 0) + (a.length > 0 ? 20 : 0));
  const emailSecurityScore = clamp((hasEmailRouting ? 40 : 0) + (hasSpf ? 30 : 0) + (hasDmarc ? 30 : 0));
  const identityScore = clamp((hasRegistrationContext ? 65 : 0) + (hasMarketplaceEvidence ? 25 : 0) + (insights.some((insight) => insight.category === "Identity Insight" && insight.riskLevel !== "Unknown") ? 10 : 0));
  const knownReputationIssue = negativeFindings.some((finding) => finding.source.toLowerCase().includes("reputation") || finding.impact.toLowerCase().includes("reputation"));
  const reputationScore: ReputationScore = knownReputationIssue ? 30 : "pending";
  const providerCompleteness = attemptedProviders > 0 ? (completedProviders / attemptedProviders) * 70 : 0;
  const supportingCompleteness = (timeline.filter((item) => item.status === "completed").length >= 3 ? 15 : 0) + (insights.filter((insight) => insight.evidence.length > 0).length >= 2 ? 15 : 0);
  const evidenceCompleteness = clamp(providerCompleteness + supportingCompleteness);
  const evidenceCoverageScore = evidenceCompleteness;
  const verificationConfidence = clamp((identityScore * 0.25) + (infrastructureScore * 0.25) + (emailSecurityScore * 0.2) + (evidenceCompleteness * 0.2) + 0);
  const confidenceScore = verificationConfidence;
  const verificationScore = clamp((identityScore * 0.3) + (infrastructureScore * 0.3) + (emailSecurityScore * 0.2) + 0);

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

  const confirmedRiskCorrelationContradictions = correlationContradictions.filter(isConfirmedRiskCorrelation);
  const reviewOnlyCorrelationContradictions = correlationContradictions.filter((item) => !isConfirmedRiskCorrelation(item));

  const correlationNegativeFindings: DecisionFinding[] = confirmedRiskCorrelationContradictions.map((item) => ({
    category: "negative",
    confidence: item.severity === "critical" ? 95 : item.severity === "high" ? 90 : 75,
    source: "correlation-intelligence",
    impact: item.title,
    explanation: item.explanation,
  }));
  const positiveCorrelationFindings: DecisionFinding[] = correlationSummary.verifiedRelationships.map((item) => ({
    category: "positive",
    confidence: item.confidence,
    source: "correlation-intelligence",
    impact: item.title,
    explanation: item.explanation,
  }));
  const reviewOnlyContradictionFindings: DecisionFinding[] = reviewOnlyCorrelationContradictions.map((item) => ({
    category: "missing",
    confidence: item.severity === "critical" ? 95 : item.severity === "high" ? 90 : 75,
    source: "correlation-intelligence",
    impact: item.title,
    explanation: `${item.explanation} This is an identity inconsistency that requires review but is not confirmed risk without independent negative evidence.`,
  }));
  const reviewOnlyNegativeFindings: DecisionFinding[] = reviewOnlyNegativeEvidenceItems.map((item) => ({
    category: "missing",
    confidence: item.confidence,
    source: item.provider,
    impact: item.title,
    explanation: `${item.businessImpact} This negative-looking identity signal requires review but is not confirmed risk without corroboration.`,
  }));
  const missingCorrelationFindings: DecisionFinding[] = [...correlationSummary.missingRelationships, ...correlationSummary.unresolvedRelationships].map((item) => ({
    category: "missing",
    confidence: item.confidence,
    source: "correlation-intelligence",
    impact: item.title,
    explanation: item.explanation,
  }));
  const missingSignals = unique([...missingFindings, ...missingCorrelationFindings, ...reviewOnlyContradictionFindings, ...reviewOnlyNegativeFindings].map((finding) => finding.impact));
  const blockingIssues = unique([...negativeFindings, ...correlationNegativeFindings].map((finding) => finding.impact));
  const positiveEvidenceCount = positiveFindings.length + positiveCorrelationFindings.length;
  const missingEvidenceCount = missingFindings.length + missingCorrelationFindings.length;
  const negativeEvidenceCount = negativeFindings.length + correlationNegativeFindings.length;
  const deterministicBlockingRule: DecisionFinding[] = [];
  const confirmedRiskEligible = negativeEvidenceCount > 0 || deterministicBlockingRule.length > 0;

  const hasMaterialContradiction = reviewOnlyCorrelationContradictions.some((item) => item.severity === "high" || item.severity === "critical");
  const hasCompoundingUncertainty = reviewOnlyNegativeEvidenceItems.length >= 2 || (reviewOnlyNegativeEvidenceItems.length >= 1 && reviewOnlyCorrelationContradictions.length >= 1);
  const hasCoreOwnershipGap = missingSignals.some((item) => /ownership|owner|beneficial/i.test(item));
  const hasStrongBusinessEvidence = positiveEvidenceCount >= 3 && infrastructureScore >= 70 && identityScore >= 60 && !hasCoreOwnershipGap;

  let decision: VerificationDecision = "PROCEED_WITH_VERIFICATION";
  if (confirmedRiskEligible) decision = "FAIL";
  else if (hasMaterialContradiction || hasCompoundingUncertainty) decision = "REVIEW";
  else if (hasStrongBusinessEvidence) decision = "PASS";

  const reasons = unique([
    `Positive evidence count is ${positiveEvidenceCount}.`,
    `Missing evidence count is ${missingEvidenceCount}; missing evidence does not count as risk.`,
    `Negative evidence count is ${negativeEvidenceCount}.`,
    `Verification confidence is ${verificationConfidence >= 70 ? "High" : verificationConfidence >= 40 ? "Medium" : "Low"} and evidence completeness is ${evidenceCompleteness >= 70 ? "High" : evidenceCompleteness >= 40 ? "Medium" : "Low"}; both are inferred from available evidence.`,
    ...blockingIssues.map((issue) => `Verified negative issue: ${issue}.`),
  ]);


  const canonicalDecision = buildCanonicalDecision({
    status: decision === "FAIL" ? "STOP" : decision,
    hasConfirmedSeriousNegative: confirmedRiskEligible,
    hasMaterialContradiction,
    hasStrongCorroboratedIdentity: hasStrongBusinessEvidence,
    hasMissingCoreIdentity: missingSignals.some((item) => /identity|business name|registry|owner/i.test(item)),
    missingEvidence: missingSignals,
    decisionReasons: reasons,
    confidenceScore: verificationConfidence,
  });
  const decisionLabel = decisionDisplayLabel(canonicalDecision.decisionOutcome) as VerificationDecisionOutput["decisionLabel"];
  const decisionColor = canonicalDecision.decisionLight.toLowerCase() as DecisionColor;

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
    findings: [...positiveFindings, ...positiveCorrelationFindings, ...missingFindings, ...missingCorrelationFindings, ...reviewOnlyContradictionFindings, ...reviewOnlyNegativeFindings, ...negativeFindings, ...correlationNegativeFindings],
    reasons,
    missingSignals,
    blockingIssues,
    recommendedAction: decision === "PASS"
      ? "Sufficient evidence was collected and no significant negative indicators were detected."
      : decision === "PROCEED_WITH_VERIFICATION"
        ? "Proceed with verification: no confirmed risk was found, but collect ownership or documentation before major commitment."
        : decision === "REVIEW"
          ? "Review is required because material contradictions or compounding uncertainty were detected."
          : "Confirmed negative indicators require investigation before proceeding.",
    limitedPreview: input.audience === "free",
    canonicalDecision,
  };
}

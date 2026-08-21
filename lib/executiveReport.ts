import { isPublicMailboxDomain } from "./emailDomains";
import type { ShadowScoreReport } from "./workspace";

export const EVIDENCE_CATEGORIES = ["Identity", "Business Registration", "Website", "Email", "DNS", "Security", "Regulatory", "Marketplace", "Social Presence", "Payment"] as const;
export type EvidenceCategory = typeof EVIDENCE_CATEGORIES[number];

export type ExecutiveEvidence = {
  id: string;
  category: EvidenceCategory;
  label: string;
  value?: string;
  source: string;
  observedAt?: string;
};

export type ExecutiveFindingStory = {
  id: string;
  title: string;
  direction: "supports_credibility" | "weakens_credibility" | "needs_review";
  observation: string;
  whyItMatters: string;
  commercialRisk: string;
  evidence: string;
  nextStep: string;
};

const categoryMatchers: Array<[EvidenceCategory, RegExp]> = [
  ["Business Registration", /registr|incorpor|company|sec|legal name|filing/i],
  ["Email", /email|dmarc|spf|mail/i],
  ["DNS", /dns|domain name|nameserver/i],
  ["Security", /security|ssl|tls|certificate|header|https/i],
  ["Regulatory", /regulat|sanction|litigation|criminal|bankrupt|compliance/i],
  ["Marketplace", /marketplace|seller|amazon|ebay/i],
  ["Social Presence", /social|linkedin|facebook|instagram|twitter|x\.com/i],
  ["Payment", /payment|bank|invoice|payout|card/i],
  ["Website", /website|http|domain|whois|reputation/i],
];

function evidenceCategory(value: string): EvidenceCategory {
  return categoryMatchers.find(([, matcher]) => matcher.test(value))?.[0] || "Identity";
}

export function groupExecutiveEvidence(report: ShadowScoreReport) {
  const findings = report.reportSummary?.businessIntelligence?.findings || [];
  const seen = new Set<string>();
  const grouped = new Map<EvidenceCategory, ExecutiveEvidence[]>();

  for (const finding of findings) {
    for (const item of finding.evidence) {
      const key = [item.source, item.label, item.value || ""].map((value) => value.trim().toLowerCase()).join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const category = evidenceCategory(`${finding.category} ${item.field} ${item.label} ${item.source}`);
      const entry: ExecutiveEvidence = { id: key, category, label: item.label, value: item.value, source: item.source, observedAt: item.observedAt };
      grouped.set(category, [...(grouped.get(category) || []), entry]);
    }
  }

  return EVIDENCE_CATEGORIES.flatMap((category) => grouped.has(category) ? [{ category, items: grouped.get(category)! }] : []);
}

export function executiveRecommendation(report: ShadowScoreReport) {
  const targetResolution = report.reportSummary?.targetResolution;
  if (targetResolution && (targetResolution.redirectDomainMismatch || targetResolution.rejectedEvidenceCount > 0)) {
    return { label: "Manual Review Required", explanation: "Evidence was isolated from the submitted target. Review the target relationship and collect matching evidence before making a decision." };
  }
  const narrative = report.reportSummary?.businessNarrative;
  const intelligence = report.reportSummary?.investigationIntelligence;
  const decision = report.reportSummary?.decision?.canonicalDecision || narrative?.decisionMode;
  const label = intelligence?.decisionSupport.outcome || (decision?.decisionOutcome === "PROCEED" ? "Proceed" : decision?.decisionOutcome === "DO_NOT_PROCEED" ? "Do Not Proceed" : "Proceed with Conditions");
  const summary = intelligence?.executiveInsight
    || decision?.userMeaning
    || report.reportSummary?.decision?.whatThisMeans
    || narrative?.sections.find((section) => section.id === "executiveSummary")?.body[0]
    || report.reportSummary?.message
    || "Review the available evidence and resolve material gaps before making a commitment.";
  const stories = executiveFindingStories(report);
  const keyFinding = stories.find((item) => item.direction === "weakens_credibility")
    || stories.find((item) => item.direction === "needs_review")
    || stories[0];
  const explanation = keyFinding
    ? `${summary} The key finding is: ${keyFinding.observation} It is supported by ${keyFinding.evidence}. ${keyFinding.commercialRisk} Required response: ${keyFinding.nextStep}`
    : summary;
  return { label, explanation };
}

export function reportFindings(report: ShadowScoreReport) {
  const findings = report.reportSummary?.businessIntelligence?.findings || [];
  const unique = <T extends { id: string }>(items: T[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());
  return {
    positive: unique(findings.filter((item) => item.direction === "supports_credibility")),
    negative: unique(findings.filter((item) => item.direction === "weakens_credibility")),
    warnings: unique(findings.filter((item) => item.direction === "needs_review")),
  };
}

function findingGuidance(context: string, direction: ExecutiveFindingStory["direction"]) {
  const value = context.toLowerCase();
  const supportive = direction === "supports_credibility";
  if (/identity|ownership/.test(value)) return supportive
    ? { whyItMatters: "It helps confirm that the business receiving the commitment is the business that was reviewed.", commercialRisk: "The risk of contracting with or paying the wrong legal entity is reduced.", nextStep: "Match the final contract, invoice, and payment account to the verified business name before sending funds." }
    : { whyItMatters: "The party requesting the commitment may not be the same business shown in independent records.", commercialRisk: "Funds, contractual rights, or recovery options could be tied to the wrong entity.", nextStep: "Obtain a current registry record and ownership document, then match them to the contract and payment account." };
  if (/payment/.test(value)) return supportive
    ? { whyItMatters: "The payment details are consistent with the business under review.", commercialRisk: "The chance of sending funds to an unrelated recipient is reduced.", nextStep: "Confirm the account holder again through an independent contact before releasing the payment." }
    : { whyItMatters: "The payment destination cannot yet be tied reliably to the business under review.", commercialRisk: "A payment could reach an unrelated party and may be difficult to recover.", nextStep: "Pause payment until the bank account holder matches the contracting entity in documentary evidence." };
  if (/infrastructure|operation/.test(value)) return supportive
    ? { whyItMatters: "The operating footprint is consistent with the business claims reviewed.", commercialRisk: "The risk of relying on a business without a stable operating presence is reduced.", nextStep: "Record the verified operating details in the contract file and monitor material changes before payment." }
    : { whyItMatters: "The operating footprint does not fully support the business claims presented.", commercialRisk: "The business may be less able to deliver, support the transaction, or remain reachable after payment.", nextStep: "Request proof of operations and use staged payment terms tied to confirmed delivery milestones." };
  if (/claim|registration/.test(value)) return supportive
    ? { whyItMatters: "Independent records support a material claim made by the business.", commercialRisk: "The risk of making the decision from an unsupported business claim is reduced.", nextStep: "Keep the supporting record with the approval file and confirm it remains current before commitment." }
    : { whyItMatters: "A material business claim is not consistent across the available records.", commercialRisk: "The decision may rely on inaccurate credentials, status, or authority.", nextStep: "Ask the business to resolve the discrepancy with a current primary-source record before commitment." };
  return supportive
    ? { whyItMatters: "Independent evidence supports this part of the business profile.", commercialRisk: "This lowers uncertainty in the commercial decision, but it does not replace standard payment controls.", nextStep: "Retain the evidence and complete the standard contract and payment checks before commitment." }
    : { whyItMatters: "This finding leaves an important part of the business profile unresolved.", commercialRisk: "The customer could commit funds without a reliable basis for assessing the counterparty.", nextStep: "Resolve the finding with current independent evidence before making the commitment." };
}

export function executiveFindingStories(report: ShadowScoreReport): ExecutiveFindingStory[] {
  const findings = report.reportSummary?.businessIntelligence?.findings || [];
  const risks = report.reportSummary?.investigationIntelligence?.risks || [];
  return findings.map((finding) => {
    const guidance = findingGuidance(`${finding.category} ${finding.title} ${finding.statement}`, finding.direction);
    const matchingRisk = risks.find((risk) => risk.id === `risk:${finding.id}` || risk.title === finding.title);
    const sources = Array.from(new Set(finding.evidence.map((item) => item.source).filter(Boolean)));
    return {
      id: finding.id,
      title: finding.title,
      direction: finding.direction,
      observation: finding.statement,
      whyItMatters: guidance.whyItMatters,
      commercialRisk: matchingRisk?.businessImpact || guidance.commercialRisk,
      evidence: sources.length ? sources.join(", ") : "The available investigation record",
      nextStep: guidance.nextStep,
    };
  });
}

export function recommendedActions(report: ShadowScoreReport) {
  const items = report.reportSummary?.businessNarrative?.sections.find((section) => section.id === "recommendedNextSteps")?.body || [];
  const gapActions = report.reportSummary?.investigationIntelligence?.evidenceGaps.map((gap) => gap.recommendation) || [];
  const clean = Array.from(new Set([...gapActions, ...items].map((item) => item.trim()).filter(Boolean)));
  const targetDomain = (report.target || report.entity || "").match(/@([^\s@]+)$/)?.[1];
  const isEmailIdentity = report.reportSummary?.investigationType === "EMAIL" && Boolean(targetDomain && isPublicMailboxDomain(targetDomain));
  const fallbacks = isEmailIdentity
    ? ["Corroborate public profile ownership.", "Verify a second independent identifier.", "Review linked public profiles and collect stronger first-party evidence."]
    : ["Verify business ownership and registration details.", "Use documented payment terms for the first transaction.", "Review material evidence gaps before proceeding."];
  if (isEmailIdentity) {
    const businessOnly = /domain-based business email|dns|tls|contract|invoice|registry|business ownership/i;
    return [...clean.filter((item) => !businessOnly.test(item)), ...fallbacks].filter((item, index, all) => all.indexOf(item) === index).slice(0, 3);
  }
  return [...clean, ...fallbacks.filter((item) => !clean.includes(item))].slice(0, 3);
}

export function executiveDecisionReasons(report: ShadowScoreReport) {
  const findings = report.reportSummary?.businessIntelligence?.findings || [];
  return findings.slice(0, 5).map((finding) => ({
    id: finding.id,
    statement: finding.statement,
    evidence: Array.from(new Set(finding.evidence.map((item) => item.source))).join(", ") || "Evidence record",
  }));
}

export function executiveBusinessImpacts(report: ShadowScoreReport) {
  const intelligence = report.reportSummary?.investigationIntelligence;
  const impacts = [
    ...(intelligence?.risks.map((risk) => risk.businessImpact) || []),
    ...(intelligence?.contradictions.map((item) => item.whyItMatters) || []),
  ];
  return Array.from(new Set(impacts.map((item) => item.trim()).filter(Boolean))).slice(0, 3);
}

export function materialEvidenceGaps(report: ShadowScoreReport) {
  return (report.reportSummary?.investigationIntelligence?.evidenceGaps || []).slice(0, 3);
}

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
  const narrative = report.reportSummary?.businessNarrative;
  const intelligence = report.reportSummary?.investigationIntelligence;
  const decision = report.reportSummary?.decision?.canonicalDecision || narrative?.decisionMode;
  const label = intelligence?.decisionSupport.outcome || (decision?.decisionOutcome === "PROCEED" ? "Proceed" : decision?.decisionOutcome === "DO_NOT_PROCEED" ? "Do Not Proceed" : "Proceed with Conditions");
  const explanation = intelligence?.executiveInsight
    || decision?.userMeaning
    || report.reportSummary?.decision?.whatThisMeans
    || narrative?.sections.find((section) => section.id === "executiveSummary")?.body[0]
    || report.reportSummary?.message
    || "Review the available evidence and resolve material gaps before making a commitment.";
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

export function recommendedActions(report: ShadowScoreReport) {
  const items = report.reportSummary?.businessNarrative?.sections.find((section) => section.id === "recommendedNextSteps")?.body || [];
  const gapActions = report.reportSummary?.investigationIntelligence?.evidenceGaps.map((gap) => gap.recommendation) || [];
  const clean = Array.from(new Set([...gapActions, ...items].map((item) => item.trim()).filter(Boolean)));
  const fallbacks = ["Verify business ownership and registration details.", "Use documented payment terms for the first transaction.", "Review material evidence gaps before proceeding."];
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

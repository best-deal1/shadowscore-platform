import type { EvidenceItem } from "../evidence";
import type { InvestigationIntelligence, InvestigationIntelligenceInput, SectionConfidence } from "./types";

export type * from "./types";
export const INVESTIGATION_INTELLIGENCE_VERSION = "investigation-intelligence-v1";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const quality = (score: number): SectionConfidence["evidenceQuality"] => score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";

function gapRecommendation(item: EvidenceItem) {
  const text = `${item.title} ${item.description} ${item.provider}`.toLowerCase();
  if (/owner|registrant|company|registr/.test(text)) return "Obtain a current registry extract and beneficial ownership record, then match both to the contracting entity.";
  if (/domain|dns|website|ssl|tls/.test(text)) return "Collect current domain registration, DNS, and TLS certificate records and verify that they resolve to the reviewed business.";
  if (/payment|bank|merchant/.test(text)) return "Request a payment-account ownership document and match the account holder to the contracting entity before payment.";
  if (/marketplace|seller/.test(text)) return "Obtain the marketplace seller profile and account identifier, then verify them against the legal business record.";
  if (/email|contact/.test(text)) return "Verify a domain-based business email and confirm it through an independent company contact channel.";
  return `Obtain a current primary-source record for ${item.title.toLowerCase()} and match it to the reviewed entity.`;
}

function confidence(items: EvidenceItem[], relevant: (item: EvidenceItem) => boolean, contradictionPenalty = 0) {
  const scoped = items.filter(relevant);
  const verified = scoped.filter((item) => item.category === "Verified");
  const gaps = scoped.filter((item) => ["Missing", "Unavailable", "Not Checked"].includes(item.category));
  const average = verified.length ? verified.reduce((sum, item) => sum + item.confidence, 0) / verified.length : 35;
  const score = clamp(average + Math.min(10, verified.length * 2) - gaps.length * 8 - contradictionPenalty);
  return { score, gaps: gaps.map((item) => item.title) };
}

function isTechnicalCollectionFailure(item: EvidenceItem) {
  const text = `${item.title} ${item.description} ${item.source} ${item.provider}`.toLowerCase();
  return /provider (?:unavailable|failed)|collection (?:failure|failed)|technical (?:failure|error)|request (?:failed|timed out)|timeout|timed out|rate limit|retrieval failed|could not be (?:checked|retrieved)|dns resolution returned/.test(text);
}

export function buildInvestigationIntelligence(input: InvestigationIntelligenceInput): InvestigationIntelligence {
  const { evidenceItems, correlationSummary, businessFindings, knowledgeGraph } = input;
  const contradictions = correlationSummary.contradictions.map((item) => ({
    id: item.id,
    title: item.title,
    severity: item.severity,
    explanation: item.explanation,
    whyItMatters: item.severity === "critical" ? "This conflict can change the commercial decision and requires resolution before commitment." : "This conflict weakens entity attribution and can expose the customer to payment, delivery, or compliance risk.",
    evidenceIds: item.evidence.map((evidence) => evidence.evidenceId),
  }));

  const relationships = [
    ...correlationSummary.verifiedRelationships.map((item) => ({ id: item.id, type: item.relationship, from: item.evidence[0]?.value || "Reviewed entity", to: item.evidence[1]?.value || "Corroborating source", confidence: item.confidence, evidenceIds: item.evidence.map((evidence) => evidence.evidenceId), explanation: item.explanation })),
    ...knowledgeGraph.relationships.map((item) => ({ id: item.id, type: item.type, from: knowledgeGraph.entities.find((entity) => entity.id === item.from)?.label || item.from, to: knowledgeGraph.entities.find((entity) => entity.id === item.to)?.label || item.to, confidence: 75, evidenceIds: item.sourceScanIds, explanation: item.context || `Observed ${item.type.toLowerCase().replace(/_/g, " ")} relationship.` })),
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);

  // Transport and provider failures are evidence gaps, even if an upstream adapter
  // accidentally labels them as negative. Only substantive adverse evidence can
  // create a blocking risk.
  const technicalFailures = evidenceItems.filter(isTechnicalCollectionFailure);
  const negativeEvidence = evidenceItems.filter((item) => item.category === "Negative" && !isTechnicalCollectionFailure(item));
  const risks = [
    ...negativeEvidence.map((item) => ({ id: `risk:${item.id}`, title: item.title, severity: (item.confidence >= 95 ? "critical" : item.confidence >= 85 ? "high" : "medium") as "critical" | "high" | "medium", whyDetected: item.description, supportingEvidence: item.evidenceRefs.map((evidence) => ({ id: evidence.id, label: evidence.label, source: evidence.source })), businessImpact: item.businessImpact })),
    ...businessFindings.filter((item) => item.direction !== "supports_credibility").map((item) => ({ id: `risk:${item.id}`, title: item.title, severity: (item.direction === "weakens_credibility" ? "high" : "medium") as "high" | "medium", whyDetected: item.statement, supportingEvidence: item.evidence.map((evidence) => ({ id: evidence.id, label: evidence.label, source: evidence.source })), businessImpact: item.direction === "weakens_credibility" ? "The inconsistency raises the chance of contracting with, paying, or relying on the wrong business entity." : "The finding requires resolution before the related commercial control can be treated as reliable." })),
  ];

  const gaps = evidenceItems.filter((item) => ["Missing", "Unavailable", "Not Checked"].includes(item.category) || isTechnicalCollectionFailure(item));
  const evidenceGaps = gaps.map((item) => ({ id: `gap:${item.id}`, missingEvidence: item.title, recommendation: gapRecommendation(item), confidenceImpact: `Resolving this gap would improve ${/owner|company|registr|identity/i.test(item.title) ? "identity" : /domain|dns|ssl|website/i.test(item.title) ? "relationship" : "decision"} confidence.` }));
  const identity = confidence(evidenceItems, (item) => /identity|business|company|owner|registr|email/.test(`${item.title} ${item.description}`.toLowerCase()), contradictions.length * 5);
  const relation = confidence(evidenceItems, (item) => /domain|dns|ssl|website|marketplace|payment|address/.test(`${item.title} ${item.description}`.toLowerCase()), correlationSummary.unresolvedRelationships.length * 4);
  const risk = confidence(evidenceItems, () => true, contradictions.length * 6);
  const decisionScore = clamp((identity.score + relation.score + risk.score) / 3 - (risks.some((item) => item.severity === "critical") ? 15 : 0));
  const sectionConfidence: SectionConfidence[] = [
    { section: "Identity", confidence: identity.score, evidenceQuality: quality(identity.score), missingEvidence: identity.gaps },
    { section: "Relationships", confidence: relation.score, evidenceQuality: quality(relation.score), missingEvidence: relation.gaps },
    { section: "Risk", confidence: risk.score, evidenceQuality: quality(risk.score), missingEvidence: gaps.map((item) => item.title) },
    { section: "Decision", confidence: decisionScore, evidenceQuality: quality(decisionScore), missingEvidence: gaps.map((item) => item.title) },
  ];

  const critical = risks.some((item) => item.severity === "critical") || contradictions.some((item) => item.severity === "critical");
  const high = risks.some((item) => item.severity === "high") || contradictions.some((item) => item.severity === "high");
  const onlyTechnicalGaps = technicalFailures.length > 0 && gaps.every(isTechnicalCollectionFailure);
  const outcome = critical ? "Do Not Proceed" : high || onlyTechnicalGaps ? "Further Investigation Required" : gaps.length || risks.length ? "Proceed with Conditions" : "Proceed";
  const executiveInsight = critical ? "The investigation identified evidence conflicts or adverse findings that create material commercial risk. Current evidence supports stopping the transaction until the findings are resolved." : high ? "The business shows some credible attributes, but material inconsistencies increase commercial risk. Resolve the identified conflicts before making a commitment." : onlyTechnicalGaps ? "Evidence collection was incomplete because one or more providers were unavailable. Further investigation is required before making a commitment." : gaps.length ? "The available evidence supports the business profile, but specific verification gaps limit confidence. Proceed only with the listed controls and evidence requests." : "The investigation found no significant warning signals. Current evidence supports proceeding with normal commercial precautions.";
  const justification = critical ? "Critical evidence conflicts or adverse findings can change the identity or risk assessment." : high ? "Material inconsistencies remain unresolved and could affect the counterparty decision." : onlyTechnicalGaps ? "Provider availability limited the evidence collected. The technical failure is not adverse business evidence." : gaps.length ? "No blocking signal was identified, but missing verification requires targeted commercial controls." : "Independent evidence is consistent and no material warning signal was identified.";

  return { engineVersion: INVESTIGATION_INTELLIGENCE_VERSION, generatedAt: input.generatedAt || new Date().toISOString(), contradictions, relationships, risks, sectionConfidence, executiveInsight, evidenceGaps, decisionSupport: { outcome, justification, conditions: evidenceGaps.slice(0, 3).map((gap) => gap.recommendation) } };
}

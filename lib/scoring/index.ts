import type { EvidenceItem } from "../evidence";
import type { ExplainableScore, ScoreInput, ScoreLevel, ShadowScorecard } from "./types";
export * from "./types";

const labels = (items: EvidenceItem[]) => items.slice(0, 5).map((item) => item.title);
function score(dimension: ExplainableScore["dimension"], evidence: EvidenceItem[]): ExplainableScore {
  const negative = evidence.filter((item) => item.category === "Negative");
  const unavailable = evidence.filter((item) => item.category === "Unavailable" || item.category === "Not Checked");
  const positive = evidence.filter((item) => item.category === "Verified");
  const level: ScoreLevel = !evidence.length || (!positive.length && unavailable.length) ? "unavailable" : negative.length ? "needs_review" : unavailable.length ? "limited" : positive.length >= 3 ? "strong" : "adequate";
  const confidence = positive.length >= 3 && !unavailable.length ? "high" : positive.length ? "medium" : "low";
  return { dimension, level, confidence, supportingEvidence: labels(evidence), positiveContributors: labels(positive), negativeContributors: labels(negative), evidenceGaps: labels(unavailable), recommendedImprovements: Array.from(new Set([...negative, ...unavailable].map((item) => item.businessImpact))).slice(0, 3) };
}
/** Produces qualitative, evidence-backed levels. It intentionally does not calculate a numeric score. */
export function buildShadowScorecard(input: ScoreInput): ShadowScorecard {
  const all = [...input.evidenceItems, ...(input.websiteEvidence || [])];
  const website = input.websiteEvidence || [];
  const security = website.filter((item) => /ssl|tls|security|header|email|reputation/i.test(`${item.provider} ${item.title}`));
  const infrastructure = website.filter((item) => /dns|infrastructure|http|technology/i.test(`${item.provider} ${item.title}`));
  const identity = all.filter((item) => /identity|business|domain|whois/i.test(`${item.provider} ${item.title}`));
  const business = all.filter((item) => !website.includes(item));
  return { generatedAt: new Date().toISOString(), scores: [score("Website Intelligence", website), score("Security Posture", security), score("Identity Confidence", identity), score("Infrastructure Maturity", infrastructure), score("Business Trust", business), score("Overall ShadowScore", all)] };
}

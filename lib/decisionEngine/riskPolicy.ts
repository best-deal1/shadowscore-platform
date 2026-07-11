import type { CorrelationContradiction } from "../correlation";
import type { EvidenceItem } from "../evidence";
import type { ContradictionSignal } from "./types";

export const confirmedRiskDecisionMatrix = [
  { signal: "Verified fraud / scam abuse", severity: "critical", evidenceSource: "reputation, abuse, compliance, legal, marketplace enforcement", requiredConfidence: ">=90 with explicit verified/confirmed/known source language", decisionImpact: "CONFIRMED RISK" },
  { signal: "Phishing or malware reputation", severity: "critical/high", evidenceSource: "reputation or security provider finding", requiredConfidence: ">=90 and explicit phishing/malware/malicious evidence", decisionImpact: "CONFIRMED RISK" },
  { signal: "Marketplace enforcement / suspension / counterfeit", severity: "critical/high", evidenceSource: "marketplace enforcement provider or corroborated enforcement finding", requiredConfidence: ">=90 and explicit enforcement action", decisionImpact: "CONFIRMED RISK" },
  { signal: "Sanctions or verified legal/compliance finding", severity: "critical/high", evidenceSource: "sanctions, regulator, court, compliance provider", requiredConfidence: ">=90 and verified legal/compliance finding", decisionImpact: "CONFIRMED RISK" },
  { signal: "Identity mismatch: email/contact/phone/business profile", severity: "medium/high", evidenceSource: "correlation or business profile contradiction", requiredConfidence: "Any single uncorroborated mismatch", decisionImpact: "REVIEW only" },
  { signal: "Missing/unavailable provider data", severity: "none", evidenceSource: "provider status or absent evidence", requiredConfidence: "N/A", decisionImpact: "REVIEW or confidence reduction only" },
] as const;

const CONFIRMED_NEGATIVE_TERMS = /\b(fraud|scam|phishing|malware|malicious|abuse|blacklist|blocked|suspended|enforcement|counterfeit|sanction|ofac|regulator|regulatory|court|lawsuit|legal|compliance|criminal|chargeback)\b/i;
const VERIFICATION_TERMS = /\b(confirmed|verified|known|listed|matched|enforced|official|authoritative)\b/i;
const IDENTITY_MISMATCH_TERMS = /\b(identity|email|contact|phone|business profile|profile|company name|name differs|mismatch|differs|inconsisten|domain mismatch|seller differs|registry)\b/i;

function joinedEvidence(values: string[]) {
  return values.join(" ");
}

export function isIdentityMismatchText(text: string) {
  return IDENTITY_MISMATCH_TERMS.test(text) && !CONFIRMED_NEGATIVE_TERMS.test(text.replace(/marketplace seller differs from company/gi, ""));
}

export function isConfirmedRiskEvidenceText(text: string) {
  return CONFIRMED_NEGATIVE_TERMS.test(text) && VERIFICATION_TERMS.test(text);
}

export function isConfirmedRiskEvidenceItem(item: EvidenceItem) {
  if (item.category !== "Negative") return false;
  const text = `${item.provider} ${item.source} ${item.title} ${item.description} ${item.businessImpact}`;
  if (isIdentityMismatchText(text)) return false;
  return isConfirmedRiskEvidenceText(text);
}

export function isConfirmedRiskCorrelation(contradiction: CorrelationContradiction) {
  if (contradiction.relationship !== "fraud_reputation") return false;
  if (contradiction.severity !== "critical" && contradiction.severity !== "high") return false;
  return isConfirmedRiskEvidenceText(`${contradiction.title} ${contradiction.explanation} ${joinedEvidence(contradiction.evidence.map((item) => item.value))}`);
}

export function isConfirmedRiskContradiction(signal: ContradictionSignal) {
  if (signal.severity !== "high") return false;
  const text = `${signal.title} ${signal.interpretation} ${signal.businessMeaning} ${joinedEvidence(signal.evidence)}`;
  if (isIdentityMismatchText(text)) return false;
  return isConfirmedRiskEvidenceText(text);
}

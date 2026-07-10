import type { CorrelationFinding, CorrelationSummary } from "./types";

export const CORRELATION_ENGINE_VERSION = "correlation-intelligence-v1";

export function summarizeCorrelation(findings: CorrelationFinding[], generatedAt = new Date().toISOString()): CorrelationSummary {
  const contradictions = findings.flatMap((finding) => finding.contradiction ? [finding.contradiction] : []);
  return {
    engineVersion: CORRELATION_ENGINE_VERSION,
    generatedAt,
    findings,
    verifiedRelationships: findings.filter((finding) => finding.classification === "Confirmed" || finding.classification === "Likely"),
    missingRelationships: findings.filter((finding) => finding.classification === "Unknown" && finding.evidence.length === 0),
    contradictions,
    unresolvedRelationships: findings.filter((finding) => finding.classification === "Unknown" && finding.evidence.length > 0),
    counts: {
      Confirmed: findings.filter((finding) => finding.classification === "Confirmed").length,
      Likely: findings.filter((finding) => finding.classification === "Likely").length,
      Unknown: findings.filter((finding) => finding.classification === "Unknown").length,
      Contradiction: findings.filter((finding) => finding.classification === "Contradiction").length,
    },
  };
}

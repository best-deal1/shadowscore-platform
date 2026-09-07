import type { ProviderResult } from "./providers/types";

export type InvestigationCompletionStatus = "COMPLETED_WITH_EVIDENCE" | "COMPLETED_WITH_UNRESOLVED_EVIDENCE" | "COVERAGE_GAP" | "PROVIDER_UNAVAILABLE" | "UNSUPPORTED_JURISDICTION" | "NO_EVIDENCE_ABSTAIN";

export function investigationCompletionStatus(results: ProviderResult[], evidenceCount: number): InvestigationCompletionStatus {
  const authoritative = results.filter((result) => result.providerId === "authoritative-company" || result.metadata.authoritative === true);
  if (authoritative.some((result) => result.metadata.executionCode === "UNSUPPORTED_JURISDICTION")) return "UNSUPPORTED_JURISDICTION";
  if (authoritative.some((result) => result.metadata.executionCode === "PROVIDER_UNAVAILABLE")) return "PROVIDER_UNAVAILABLE";
  if (authoritative.some((result) => result.metadata.executionCode === "NO_AUTHORITATIVE_MATCH" || result.metadata.executionCode === "NO_EVIDENCE_RETURNED")) return "COMPLETED_WITH_UNRESOLVED_EVIDENCE";
  if (authoritative.some((result) => result.metadata.coverageState === "gap")) return "COVERAGE_GAP";
  if (evidenceCount === 0) return "NO_EVIDENCE_ABSTAIN";
  return "COMPLETED_WITH_EVIDENCE";
}

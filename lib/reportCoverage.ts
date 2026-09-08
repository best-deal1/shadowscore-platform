import type { ProviderResult } from "./providers/types";
import type { EvidenceItem } from "./evidence";

export type InvestigationCompletionStatus = "COMPLETED_WITH_EVIDENCE" | "COMPLETED_WITH_UNRESOLVED_EVIDENCE" | "COVERAGE_GAP" | "PROVIDER_UNAVAILABLE" | "UNSUPPORTED_JURISDICTION" | "NO_EVIDENCE_ABSTAIN";

function isSubstantiveEvidence(item: EvidenceItem) {
  if (item.category !== "Verified" && item.category !== "Negative") return false;
  return item.evidenceRefs.some((reference) => reference.type !== "placeholder" && reference.type !== "search_result" && reference.type !== "provider");
}

export function investigationCompletionStatus(results: ProviderResult[], evidenceItems: EvidenceItem[]): InvestigationCompletionStatus {
  if (results.some((result) => result.metadata.executionCode === "UNSUPPORTED_JURISDICTION")) return "UNSUPPORTED_JURISDICTION";
  if (results.some((result) => result.metadata.executionCode === "PROVIDER_UNAVAILABLE")) return "PROVIDER_UNAVAILABLE";
  if (results.some((result) => result.metadata.executionCode === "PROVIDER_EXECUTION_TIMEOUT" || result.metadata.executionCode === "PROVIDER_EXECUTION_FAILURE")) return "COVERAGE_GAP";
  if (results.some((result) => result.metadata.executionCode === "NO_AUTHORITATIVE_MATCH" || result.metadata.executionCode === "NO_EVIDENCE_RETURNED")) return "COMPLETED_WITH_UNRESOLVED_EVIDENCE";
  if (results.some((result) => result.metadata.coverageState === "gap")) return "COVERAGE_GAP";
  if (!evidenceItems.some(isSubstantiveEvidence)) return "NO_EVIDENCE_ABSTAIN";
  return "COMPLETED_WITH_EVIDENCE";
}

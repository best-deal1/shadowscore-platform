import type { EnginePlanStep } from "./orchestrator/types";
import type { ProviderExecutionRecord } from "./providers/ProviderManager";
import type { ProviderResult } from "./providers/types";
import type { EvidenceItem } from "./evidence";

export type InvestigationCompletionStatus = "COMPLETED_WITH_EVIDENCE" | "COMPLETED_WITH_UNRESOLVED_EVIDENCE" | "COVERAGE_GAP" | "PROVIDER_UNAVAILABLE" | "UNSUPPORTED_JURISDICTION" | "NO_EVIDENCE_ABSTAIN";

type CompletionExecutionContext = {
  executionRecords: ProviderExecutionRecord[];
  requiredPlanSteps: EnginePlanStep[];
};

function isSubstantiveEvidence(item: EvidenceItem) {
  if (item.category !== "Verified" && item.category !== "Negative") return false;
  return item.evidenceRefs.some((reference) =>
    reference.type !== "placeholder"
    && reference.type !== "search_result"
    && reference.type !== "provider"
    && reference.source !== "submitted-target"
    && !/^(?:dns|profile|metadata)-domain$/.test(reference.id),
  );
}

const FAILED_HTTP_OUTCOMES = new Set(["blocked", "timeout", "network_failure", "tls_failure", "unsupported_content", "challenge_page", "parser_failure"]);

function hasFailedHttpOutcome(result: ProviderResult) {
  const outcome = result.metadata.httpOutcome;
  const statusCode = result.metadata.httpDiagnostics && typeof result.metadata.httpDiagnostics === "object"
    ? (result.metadata.httpDiagnostics as { statusCode?: unknown }).statusCode
    : undefined;
  return (typeof statusCode === "number" && (statusCode < 200 || statusCode >= 300))
    || (typeof outcome === "string" && FAILED_HTTP_OUTCOMES.has(outcome));
}

function hasRequiredExecutionGap(context?: CompletionExecutionContext) {
  if (!context) return false;
  const recordsByEngine = new Map(context.executionRecords.map((record) => [record.engineId, record]));
  return context.requiredPlanSteps.some((step) => {
    if (!step.required) return false;
    const record = recordsByEngine.get(step.engineId);
    return !record || record.status !== "executed";
  });
}

export function investigationCompletionStatus(
  results: ProviderResult[],
  evidenceItems: EvidenceItem[],
  executionContext?: CompletionExecutionContext,
): InvestigationCompletionStatus {
  if (results.some((result) => result.metadata.executionCode === "UNSUPPORTED_JURISDICTION")) return "UNSUPPORTED_JURISDICTION";
  if (results.some((result) => result.metadata.executionCode === "PROVIDER_UNAVAILABLE")) return "PROVIDER_UNAVAILABLE";
  if (results.some((result) => result.metadata.executionCode === "PROVIDER_EXECUTION_TIMEOUT" || result.metadata.executionCode === "PROVIDER_EXECUTION_FAILURE")) return "COVERAGE_GAP";
  if (results.some(hasFailedHttpOutcome)) return "COVERAGE_GAP";
  if (hasRequiredExecutionGap(executionContext)) return "COVERAGE_GAP";
  if (results.some((result) => result.metadata.executionCode === "NO_AUTHORITATIVE_MATCH" || result.metadata.executionCode === "NO_EVIDENCE_RETURNED")) return "COMPLETED_WITH_UNRESOLVED_EVIDENCE";
  if (results.some((result) => result.metadata.coverageState === "gap")) return "COVERAGE_GAP";
  if (!evidenceItems.some(isSubstantiveEvidence)) return "NO_EVIDENCE_ABSTAIN";
  return "COMPLETED_WITH_EVIDENCE";
}

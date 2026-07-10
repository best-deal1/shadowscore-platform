import { extractEvidenceFacts } from "./relationships";
import { evaluateCorrelationRules } from "./rules";
import { summarizeCorrelation } from "./summary";
import type { CorrelationInput, CorrelationSummary } from "./types";

export function correlateEvidence(input: CorrelationInput): CorrelationSummary {
  const facts = extractEvidenceFacts(input.evidenceItems);
  const findings = evaluateCorrelationRules(facts);
  return summarizeCorrelation(findings, input.generatedAt);
}

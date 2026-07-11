export * from "./types";
export { evaluateDecisionEvidence } from "./evaluator";
import type { CorrelationSummary } from "../correlation";
import type { EvidenceItem } from "../evidence";
import type { TrustInsight } from "../insightEngine";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";
import { buildVerificationDecision } from "./model";
export type { DecisionColor, ReputationScore, VerificationDecision, VerificationDecisionOutput } from "./model";

export const DECISION_ENGINE_VERSION = "decision-engine-v2";

export type DecisionLabel = "Verified enough to proceed" | "Additional verification recommended" | "Do not proceed";
export type DecisionConfidence = "Low" | "Medium" | "High";
export type DecisionAudience = "free" | "paid";

export type DecisionOutput = {
  engineVersion: string;
  generatedAt: string;
  audience: DecisionAudience;
  decisionLabel: DecisionLabel;
  confidenceLevel: DecisionConfidence;
  topReasons: string[];
  whatThisMeans: string;
  recommendedAction: string;
  limitedPreview: boolean;
} & import("./model").VerificationDecisionOutput;

export function buildDecision(input: {
  providerResults?: ProviderResult[];
  evidenceItems?: EvidenceItem[];
  correlationSummary?: CorrelationSummary;
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: DecisionAudience;
  targetType?: string;
}): DecisionOutput {
  const model = buildVerificationDecision(input);

  return {
    engineVersion: DECISION_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    audience: input.audience,
    ...model,
    decisionLabel: model.decisionLabel,
    confidenceLevel: model.confidenceScore >= 70 ? "High" : model.confidenceScore >= 40 ? "Medium" : "Low",
    topReasons: model.reasons.slice(0, 3),
    whatThisMeans: model.decision === "PASS"
      ? "Sufficient evidence was collected and no significant negative indicators were detected."
      : model.decision === "REVIEW"
        ? "Additional verification is recommended because public evidence is incomplete. No confirmed negative indicators were detected."
        : "Confirmed negative indicators require investigation before proceeding.",
    recommendedAction: model.recommendedAction,
    limitedPreview: input.audience === "free",
  };
}

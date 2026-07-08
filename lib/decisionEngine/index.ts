export * from "./types";
export { evaluateDecisionEvidence } from "./evaluator";
import type { TrustInsight } from "../insightEngine";
import type { ProviderResult } from "../providers/types";
import type { RiskEngineOutput } from "../riskEngine";
import type { TrustTimelineItem } from "../trustTimeline";
import { buildVerificationDecision } from "./model";
export type { DecisionColor, ReputationScore, VerificationDecision, VerificationDecisionOutput } from "./model";

export const DECISION_ENGINE_VERSION = "decision-engine-v1";

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
  riskOutput?: RiskEngineOutput;
  insights?: TrustInsight[];
  timeline?: TrustTimelineItem[];
  audience: DecisionAudience;
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
      ? "The deterministic verification model found strong infrastructure, usable email or domain evidence, partial identity evidence and no blocking contradiction."
      : model.decision === "REVIEW"
        ? "The evidence is useful, but missing ownership, registry, reputation or other signals mean additional verification is recommended."
        : "The deterministic verification model found a blocking issue, failed critical check, known reputation issue or score below the safe threshold.",
    recommendedAction: model.recommendedAction,
    limitedPreview: input.audience === "free",
  };
}

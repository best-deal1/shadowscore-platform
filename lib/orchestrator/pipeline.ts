import { classifyTarget } from "../targetClassifier";
import { createExecutionPlan } from "./planner";
import type { ExecutionPlan, TargetClassificationInput } from "./types";

export function planFromClassification(
  classification: TargetClassificationInput,
  routing?: import("../investigationRouting").InvestigationRouting,
): ExecutionPlan {
  return createExecutionPlan(classification, routing);
}

export function planFromTarget(input: unknown): ExecutionPlan {
  return createExecutionPlan(classifyTarget(input));
}

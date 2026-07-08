import { classifyTarget } from "../targetClassifier";
import { createExecutionPlan } from "./planner";
import type { ExecutionPlan, TargetClassificationInput } from "./types";

export function planFromClassification(
  classification: TargetClassificationInput,
): ExecutionPlan {
  return createExecutionPlan(classification);
}

export function planFromTarget(input: unknown): ExecutionPlan {
  return createExecutionPlan(classifyTarget(input));
}

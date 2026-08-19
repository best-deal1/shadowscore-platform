import type {
  TargetClassificationResult,
  TargetType,
} from "../targetClassifier/types";

export type OrchestratorEngineId =
  | "dns"
  | "whois"
  | "ssl"
  | "headers"
  | "business-profile"
  | "marketplace"
  | "reputation"
  | "graph"
  | "email-intelligence"
  | "external-identity"
  | "domain"
  | "evidence-parser"
  | "contradiction-engine";

export type CoverageLevel = "limited" | "partial" | "strong" | "comprehensive";

export interface EnginePlanStep {
  engineId: OrchestratorEngineId;
  label: string;
  order: number;
  required: boolean;
  reason: string;
}

export interface SkippedEngine {
  engineId: OrchestratorEngineId;
  label: string;
  reason: string;
}

export interface ExecutionPlan {
  planId: string;
  targetType: TargetType;
  target: string;
  detectedPlatform: string | null;
  executionPlan: EnginePlanStep[];
  skippedEngines: SkippedEngine[];
  reasoning: string[];
  estimatedCoverage: CoverageLevel;
}

export type TargetClassificationInput = TargetClassificationResult;

export interface EngineDefinition {
  engineId: OrchestratorEngineId;
  label: string;
  supportedTargets: TargetType[];
}

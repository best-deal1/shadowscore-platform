import { getTrustGraphService } from "@/lib/trustGraph";
import { IntelligenceService } from "./service";
export { IntelligenceService } from "./service";
export type { IntelligenceGraphReader, IntelligenceResult, IntelligenceType, ReasoningStep, RecommendedAction, RecommendationType, Severity } from "./types";
export function getIntelligenceService() { return new IntelligenceService(getTrustGraphService()); }

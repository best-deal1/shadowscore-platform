import { createOntologyEntity } from "./entities";
import type { EnforcementEvent, ObservedOutcome, OntologySource, Recommendation, RiskSignal } from "./types";

export function createRiskSignal(label: string, source: OntologySource | string, evidenceRefs: string[], createdAt?: string): RiskSignal {
  return createOntologyEntity({ type: "RiskSignal", label, source, confidence: 0.72, evidenceRefs, createdAt }) as RiskSignal;
}

export function createRecommendation(label: string, source: OntologySource | string, evidenceRefs: string[], createdAt?: string): Recommendation {
  return createOntologyEntity({ type: "Recommendation", label, source, confidence: 0.78, evidenceRefs, createdAt }) as Recommendation;
}

export function createEnforcementEvent(label: string, source: OntologySource | string, evidenceRefs: string[], createdAt?: string): EnforcementEvent {
  return createOntologyEntity({ type: "EnforcementEvent", label, source, confidence: 0.65, evidenceRefs, createdAt }) as EnforcementEvent;
}

export function createObservedOutcome(label: string, source: OntologySource | string, evidenceRefs: string[], createdAt?: string): ObservedOutcome {
  return createOntologyEntity({ type: "ObservedOutcome", label, source, confidence: 0.7, evidenceRefs, createdAt }) as ObservedOutcome;
}

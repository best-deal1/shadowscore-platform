import { InMemoryTrustGraphStore, type TrustGraphStore } from "./store";
import type { CreateRelationshipInput, RecordDecisionInput, TrustGraphEntity, TrustGraphTimelineEvent, TrustGraphTrust, UpsertEntityInput } from "./types";

export class TrustGraphService {
  constructor(private readonly store: TrustGraphStore) {}

  getEntity(id: string) { return this.store.getEntity(id); }
  getRelationships(entityId: string) { return this.store.listRelationships(entityId); }
  getTimeline(entityId: string) { return this.store.listTimeline(entityId); }
  getDecisions(entityId: string) { return this.store.listDecisions(entityId); }
  getTrust(entityId: string) { return this.store.getTrust(entityId); }

  upsertEntity(input: UpsertEntityInput): TrustGraphEntity {
    const existing = this.store.getEntity(input.id);
    const entity = this.store.upsertEntity({ ...input, confidence: normalizeConfidence(input.confidence) });
    this.recordEvent(entity.id, existing ? "entity_updated" : "entity_created", input.provenance, existing ? "Canonical entity attributes were updated." : "Canonical entity was created.", { entityType: entity.type });
    return entity;
  }

  createRelationship(input: CreateRelationshipInput) {
    this.requireEntity(input.fromEntityId);
    this.requireEntity(input.toEntityId);
    const relationship = this.store.createRelationship({ ...input, confidence: normalizeConfidence(input.confidence), evidenceIds: unique(input.evidenceIds) });
    this.recordEvent(input.fromEntityId, "relationship_created", input.provenance, `Relationship ${input.type} was recorded.`, { relationshipId: relationship.id, relatedEntityId: input.toEntityId }, relationship.evidenceIds);
    this.recordEvent(input.toEntityId, "relationship_created", input.provenance, `Relationship ${input.type} was recorded.`, { relationshipId: relationship.id, relatedEntityId: input.fromEntityId }, relationship.evidenceIds);
    return relationship;
  }

  recordDecision(input: RecordDecisionInput) {
    this.requireEntity(input.entityId);
    const decision = this.store.recordDecision({ ...input, confidence: normalizeConfidence(input.confidence), evidenceIds: unique(input.evidenceIds), previousDecisionIds: unique(input.previousDecisionIds) });
    this.recordEvent(input.entityId, "decision_recorded", input.provenance, "A decision was recorded as permanent decision memory.", { decisionId: decision.id, recommendation: decision.recommendation, policyVersion: decision.policyVersion }, decision.evidenceIds, { type: "analyst", id: decision.analyst });
    return decision;
  }

  setTrust(trust: TrustGraphTrust) {
    this.requireEntity(trust.entityId);
    const previous = this.store.getTrust(trust.entityId);
    const normalized = { ...trust, score: normalizeScore(trust.score), confidence: normalizeConfidence(trust.confidence), evidenceIds: unique(trust.evidenceIds) };
    this.store.setTrust(normalized);
    this.recordEvent(trust.entityId, "trust_changed", { source: "trust-engine", engine: "trust-engine", engineVersion: trust.engineVersion, observedAt: trust.calculatedAt, ingestedAt: trust.calculatedAt }, "Trust score was calculated.", { previousScore: previous?.score, score: normalized.score, explanation: normalized.explanation }, normalized.evidenceIds);
    return normalized;
  }

  private requireEntity(id: string) { if (!this.store.getEntity(id)) throw new Error(`Unknown Trust Graph entity: ${id}`); }
  private recordEvent(entityId: string, type: TrustGraphTimelineEvent["type"], provenance: TrustGraphTimelineEvent["provenance"], reason: string, details: Record<string, unknown>, evidenceIds: string[] = [], actor: TrustGraphTimelineEvent["actor"] = { type: "engine", id: provenance.engine }) {
    this.store.appendTimeline({ id: `${type}:${entityId}:${provenance.ingestedAt}`, entityId, type, occurredAt: provenance.observedAt, recordedAt: provenance.ingestedAt, actor, reason, evidenceIds, provenance, details });
  }
}

function normalizeConfidence(value: number) { return Math.max(0, Math.min(1, value)); }
function normalizeScore(value: number) { return Math.max(0, Math.min(100, value)); }
function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }

const globalStore = globalThis as typeof globalThis & { trustGraphStore?: InMemoryTrustGraphStore };
export function getTrustGraphService() {
  globalStore.trustGraphStore ??= new InMemoryTrustGraphStore();
  return new TrustGraphService(globalStore.trustGraphStore);
}

import { InMemoryTrustGraphStore, type TrustGraphStore } from "./store.ts";
import type { CreateRelationshipInput, RecordDecisionInput, TrustGraphEntity, TrustGraphTimelineEvent, TrustGraphTrust, UpsertEntityInput } from "./types.ts";
import type { WorkspaceActor } from "../workspace/actor.ts";

export class TrustGraphAccessError extends Error {}
export class TrustGraphNotFoundError extends Error {}

export class TrustGraphService {
  private readonly store: TrustGraphStore;
  private readonly actor: WorkspaceActor;

  constructor(store: TrustGraphStore, actor: WorkspaceActor) {
    this.store = store;
    this.actor = actor;
  }

  getEntity(id: string) { return this.store.getEntity(this.actor.organizationId, id); }
  getRelationships(entityId: string) { this.requireEntity(entityId); return this.store.listRelationships(this.actor.organizationId, entityId); }
  getTimeline(entityId: string) { this.requireEntity(entityId); return this.store.listTimeline(this.actor.organizationId, entityId); }
  getDecisions(entityId: string) { this.requireEntity(entityId); return this.store.listDecisions(this.actor.organizationId, entityId); }
  getTrust(entityId: string) { this.requireEntity(entityId); return this.store.getTrust(this.actor.organizationId, entityId); }

  upsertEntity(input: UpsertEntityInput): TrustGraphEntity {
    this.requireWriteAccess();
    const existing = this.getEntity(input.id);
    const entity = this.store.upsertEntity(this.actor.organizationId, { ...input, confidence: normalizeConfidence(input.confidence) });
    this.recordEvent(entity.id, existing ? "entity_updated" : "entity_created", input.provenance, existing ? "Canonical entity attributes were updated." : "Canonical entity was created.", { entityType: entity.type });
    return entity;
  }

  createRelationship(input: CreateRelationshipInput) {
    this.requireWriteAccess();
    this.requireEntity(input.fromEntityId);
    this.requireEntity(input.toEntityId);
    const relationship = this.store.createRelationship(this.actor.organizationId, { ...input, confidence: normalizeConfidence(input.confidence), evidenceIds: unique(input.evidenceIds) });
    this.recordEvent(input.fromEntityId, "relationship_created", input.provenance, `Relationship ${input.type} was recorded.`, { relationshipId: relationship.id, relatedEntityId: input.toEntityId }, relationship.evidenceIds);
    this.recordEvent(input.toEntityId, "relationship_created", input.provenance, `Relationship ${input.type} was recorded.`, { relationshipId: relationship.id, relatedEntityId: input.fromEntityId }, relationship.evidenceIds);
    return relationship;
  }

  recordDecision(input: RecordDecisionInput) {
    this.requireWriteAccess();
    this.requireEntity(input.entityId);
    const decision = this.store.recordDecision(this.actor.organizationId, { ...input, confidence: normalizeConfidence(input.confidence), evidenceIds: unique(input.evidenceIds), previousDecisionIds: unique(input.previousDecisionIds) });
    this.recordEvent(input.entityId, "decision_recorded", input.provenance, "A decision was recorded as permanent decision memory.", { decisionId: decision.id, recommendation: decision.recommendation, policyVersion: decision.policyVersion }, decision.evidenceIds, { type: "analyst", id: decision.analyst });
    return decision;
  }

  setTrust(trust: TrustGraphTrust) {
    this.requireWriteAccess();
    this.requireEntity(trust.entityId);
    const previous = this.store.getTrust(this.actor.organizationId, trust.entityId);
    const normalized = { ...trust, score: normalizeScore(trust.score), confidence: normalizeConfidence(trust.confidence), evidenceIds: unique(trust.evidenceIds) };
    this.store.setTrust(this.actor.organizationId, normalized);
    this.recordEvent(trust.entityId, "trust_changed", { source: "trust-engine", engine: "trust-engine", engineVersion: trust.engineVersion, observedAt: trust.calculatedAt, ingestedAt: trust.calculatedAt }, "Trust score was calculated.", { previousScore: previous?.score, score: normalized.score, explanation: normalized.explanation }, normalized.evidenceIds);
    return normalized;
  }

  private requireWriteAccess() { if (this.actor.role === "viewer") throw new TrustGraphAccessError("This role cannot modify the Trust Graph."); }
  private requireEntity(id: string) { if (!this.getEntity(id)) throw new TrustGraphNotFoundError("Trust Graph entity not found."); }
  private recordEvent(entityId: string, type: TrustGraphTimelineEvent["type"], provenance: TrustGraphTimelineEvent["provenance"], reason: string, details: Record<string, unknown>, evidenceIds: string[] = [], actor: TrustGraphTimelineEvent["actor"] = { type: "engine", id: provenance.engine }) {
    this.store.appendTimeline(this.actor.organizationId, { id: `${type}:${entityId}:${provenance.ingestedAt}`, entityId, type, occurredAt: provenance.observedAt, recordedAt: provenance.ingestedAt, actor, reason, evidenceIds, provenance, details });
  }
}

function normalizeConfidence(value: number) { return Math.max(0, Math.min(1, value)); }
function normalizeScore(value: number) { return Math.max(0, Math.min(100, value)); }
function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }

const globalStore = globalThis as typeof globalThis & { trustGraphStore?: InMemoryTrustGraphStore };
export function getTrustGraphService(actor: WorkspaceActor) {
  globalStore.trustGraphStore ??= new InMemoryTrustGraphStore();
  return new TrustGraphService(globalStore.trustGraphStore, actor);
}

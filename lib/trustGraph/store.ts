import type { CreateRelationshipInput, RecordDecisionInput, TrustGraphDecision, TrustGraphEntity, TrustGraphRelationship, TrustGraphTimelineEvent, TrustGraphTrust, UpsertEntityInput } from "./types";

export interface TrustGraphStore {
  getEntity(id: string): TrustGraphEntity | undefined;
  upsertEntity(input: UpsertEntityInput): TrustGraphEntity;
  listRelationships(entityId: string): TrustGraphRelationship[];
  createRelationship(input: CreateRelationshipInput): TrustGraphRelationship;
  listTimeline(entityId: string): TrustGraphTimelineEvent[];
  appendTimeline(event: TrustGraphTimelineEvent): void;
  listDecisions(entityId: string): TrustGraphDecision[];
  recordDecision(input: RecordDecisionInput): TrustGraphDecision;
  getTrust(entityId: string): TrustGraphTrust | undefined;
  setTrust(trust: TrustGraphTrust): void;
}

export class InMemoryTrustGraphStore implements TrustGraphStore {
  private readonly entities = new Map<string, TrustGraphEntity>();
  private readonly relationships = new Map<string, TrustGraphRelationship>();
  private readonly timeline = new Map<string, TrustGraphTimelineEvent[]>();
  private readonly decisions = new Map<string, TrustGraphDecision[]>();
  private readonly trust = new Map<string, TrustGraphTrust>();

  getEntity(id: string) { return this.entities.get(id); }
  upsertEntity(input: UpsertEntityInput) {
    const now = input.provenance.ingestedAt;
    const existing = this.entities.get(input.id);
    const entity = { ...input, createdAt: existing?.createdAt ?? now, updatedAt: now };
    this.entities.set(entity.id, entity);
    return entity;
  }
  listRelationships(entityId: string) { return [...this.relationships.values()].filter((item) => item.fromEntityId === entityId || item.toEntityId === entityId); }
  createRelationship(input: CreateRelationshipInput) {
    const relationship = { ...input, createdAt: input.provenance.ingestedAt, updatedAt: input.provenance.ingestedAt };
    this.relationships.set(relationship.id, relationship);
    return relationship;
  }
  listTimeline(entityId: string) { return [...(this.timeline.get(entityId) ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)); }
  appendTimeline(event: TrustGraphTimelineEvent) { this.timeline.set(event.entityId, [...(this.timeline.get(event.entityId) ?? []), event]); }
  listDecisions(entityId: string) { return [...(this.decisions.get(entityId) ?? [])].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)); }
  recordDecision(input: RecordDecisionInput) { this.decisions.set(input.entityId, [...(this.decisions.get(input.entityId) ?? []), input]); return input; }
  getTrust(entityId: string) { return this.trust.get(entityId); }
  setTrust(trust: TrustGraphTrust) { this.trust.set(trust.entityId, trust); }
}

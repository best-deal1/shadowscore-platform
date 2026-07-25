import type { CreateRelationshipInput, RecordDecisionInput, TrustGraphDecision, TrustGraphEntity, TrustGraphRelationship, TrustGraphTimelineEvent, TrustGraphTrust, UpsertEntityInput } from "./types";

export interface TrustGraphStore {
  getEntity(organizationId: string, id: string): TrustGraphEntity | undefined;
  upsertEntity(organizationId: string, input: UpsertEntityInput): TrustGraphEntity;
  listRelationships(organizationId: string, entityId: string): TrustGraphRelationship[];
  createRelationship(organizationId: string, input: CreateRelationshipInput): TrustGraphRelationship;
  listTimeline(organizationId: string, entityId: string): TrustGraphTimelineEvent[];
  appendTimeline(organizationId: string, event: TrustGraphTimelineEvent): void;
  listDecisions(organizationId: string, entityId: string): TrustGraphDecision[];
  recordDecision(organizationId: string, input: RecordDecisionInput): TrustGraphDecision;
  getTrust(organizationId: string, entityId: string): TrustGraphTrust | undefined;
  setTrust(organizationId: string, trust: TrustGraphTrust): void;
}

export class InMemoryTrustGraphStore implements TrustGraphStore {
  private readonly entities = new Map<string, TrustGraphEntity>();
  private readonly relationships = new Map<string, TrustGraphRelationship>();
  private readonly timeline = new Map<string, TrustGraphTimelineEvent[]>();
  private readonly decisions = new Map<string, TrustGraphDecision[]>();
  private readonly trust = new Map<string, TrustGraphTrust>();

  private key(organizationId: string, id: string) { return `${organizationId}:${id}`; }
  getEntity(organizationId: string, id: string) { return this.entities.get(this.key(organizationId, id)); }
  upsertEntity(organizationId: string, input: UpsertEntityInput) {
    const now = input.provenance.ingestedAt;
    const key = this.key(organizationId, input.id);
    const existing = this.entities.get(key);
    const entity = { ...input, createdAt: existing?.createdAt ?? now, updatedAt: now };
    this.entities.set(key, entity);
    return entity;
  }
  listRelationships(organizationId: string, entityId: string) { const prefix = `${organizationId}:`; return [...this.relationships.entries()].filter(([key]) => key.startsWith(prefix)).map(([, item]) => item).filter((item) => item.fromEntityId === entityId || item.toEntityId === entityId); }
  createRelationship(organizationId: string, input: CreateRelationshipInput) {
    const relationship = { ...input, createdAt: input.provenance.ingestedAt, updatedAt: input.provenance.ingestedAt };
    this.relationships.set(this.key(organizationId, relationship.id), relationship);
    return relationship;
  }
  listTimeline(organizationId: string, entityId: string) { return [...(this.timeline.get(this.key(organizationId, entityId)) ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)); }
  appendTimeline(organizationId: string, event: TrustGraphTimelineEvent) { const key = this.key(organizationId, event.entityId); this.timeline.set(key, [...(this.timeline.get(key) ?? []), event]); }
  listDecisions(organizationId: string, entityId: string) { return [...(this.decisions.get(this.key(organizationId, entityId)) ?? [])].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)); }
  recordDecision(organizationId: string, input: RecordDecisionInput) { const key = this.key(organizationId, input.entityId); this.decisions.set(key, [...(this.decisions.get(key) ?? []), input]); return input; }
  getTrust(organizationId: string, entityId: string) { return this.trust.get(this.key(organizationId, entityId)); }
  setTrust(organizationId: string, trust: TrustGraphTrust) { this.trust.set(this.key(organizationId, trust.entityId), trust); }
}

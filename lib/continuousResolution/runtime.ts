import { createHash } from "node:crypto";
import { currentEntityProjection, ResolutionLedger } from "../entityIntelligence/ledger";
import { DEFAULT_RESOLVER_POLICY, resolveEntities } from "../entityIntelligence/resolver";
import type { Entity, Observation, ResolutionDecision, ResolverPolicy } from "../entityIntelligence/types";
import { IdentityIndex } from "./indexes";
import { EVENT_SCHEMA_VERSION, type IdentityProjection, type Page, type ResolutionEvent, type ResolutionEventType, type RuntimeMetrics, type TimelineEntry } from "./types";

const stableId = (...parts: Array<string | number>) => createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
const clone = <T>(value: T): T => structuredClone(value);

export class ContinuousResolutionEngine {
  readonly index = new IdentityIndex();
  readonly ledger = new ResolutionLedger();
  private readonly entities = new Map<string, Entity>();
  private readonly observations = new Map<string, Observation>();
  private readonly events: ResolutionEvent[] = [];
  private readonly projections = new Map<string, IdentityProjection>();
  private readonly decisions = new Map<string, ResolutionDecision>();
  private policy: ResolverPolicy;
  private latencySamples: number[] = [];

  constructor(seed: { entities?: Entity[]; observations?: Observation[]; policy?: ResolverPolicy } = {}) {
    this.policy = clone(seed.policy ?? DEFAULT_RESOLVER_POLICY);
    for (const entity of seed.entities ?? []) { this.entities.set(entity.entityId, clone(entity)); this.index.upsert(entity); }
    for (const observation of seed.observations ?? []) this.observations.set(observation.observationId, clone(observation));
    for (const entity of this.entities.values()) this.setProjection(entity, 1, entity.observationIds.length ? .75 : 0, "1970-01-01T00:00:00.000Z");
  }

  addObservation(observation: Observation, entityId: string | null, occurredAt = observation.observedAt) {
    const started = performance.now();
    if (entityId) this.requireEntity(entityId);
    const previous = this.observations.get(observation.observationId);
    if (previous && JSON.stringify(previous) === JSON.stringify(observation)) return { candidates: [], decisions: [], idempotent: true };
    this.observations.set(observation.observationId, clone(observation));
    this.publish(previous ? "ObservationUpdated" : "ObservationAdded", observation.workspaceId, entityId, occurredAt, observation.observationId, { observation: clone(observation) });
    if (entityId) this.attachObservation(entityId, observation);
    const candidateIds = this.index.candidates(observation.attribute, observation.normalizedValue).filter(id => id !== entityId && this.entities.get(id)?.workspaceId === observation.workspaceId);
    const subject = entityId ? this.entities.get(entityId) : undefined;
    const decisions: ResolutionDecision[] = [];
    if (subject) for (const candidateId of candidateIds) {
      const candidate = this.entities.get(candidateId)!;
      const prior = [...this.decisions.values()].reverse().find(item => [item.leftEntityId, item.rightEntityId].includes(subject.entityId) && [item.leftEntityId, item.rightEntityId].includes(candidateId));
      const decision = resolveEntities(subject, candidate, [...this.observations.values()], { policy: this.policy, now: occurredAt, supersedesDecisionId: prior?.decisionId });
      this.ledger.append(decision); this.decisions.set(decision.decisionId, clone(decision)); decisions.push(decision);
      if (decision.outcome === "MATCH") this.publish("EntityMatched", subject.workspaceId, subject.entityId, occurredAt, decision.decisionId, { decision: clone(decision), candidateEntityId: candidateId });
    }
    if (subject) this.refreshAffected([subject.entityId, ...candidateIds], occurredAt, observation.observationId);
    this.latencySamples.push(performance.now() - started); this.latencySamples = this.latencySamples.slice(-1000);
    return { candidates: candidateIds, decisions: clone(decisions), idempotent: false };
  }

  merge(entityId: string, mergedEntityId: string, occurredAt: string, correlationId = `${entityId}:${mergedEntityId}:merge`) {
    this.publish("EntityMerged", this.requireEntity(entityId).workspaceId, entityId, occurredAt, correlationId, { mergedEntityId });
    this.refreshAffected([entityId, mergedEntityId], occurredAt, correlationId);
  }

  split(entityId: string, splitEntityId: string, occurredAt: string, correlationId = `${entityId}:${splitEntityId}:split`) {
    this.publish("EntitySplit", this.requireEntity(entityId).workspaceId, entityId, occurredAt, correlationId, { splitEntityId });
    this.refreshAffected([entityId, splitEntityId], occurredAt, correlationId);
  }

  changePolicy(policy: ResolverPolicy, workspaceId: string, occurredAt: string) {
    if (policy.version === this.policy.version) return;
    const previousVersion = this.policy.version; this.policy = clone(policy);
    this.publish("PolicyChanged", workspaceId, null, occurredAt, policy.version, { previousVersion, policy: clone(policy) });
    for (const entity of this.entities.values()) if (entity.workspaceId === workspaceId) this.refreshAffected([entity.entityId], occurredAt, policy.version);
  }

  expireEvidence(observationId: string, occurredAt: string) {
    const observation = this.observations.get(observationId); if (!observation) return false;
    const entity = [...this.entities.values()].find(item => item.observationIds.includes(observationId));
    this.publish("EvidenceExpired", observation.workspaceId, entity?.entityId ?? null, occurredAt, observationId, { observationId, evidenceReference: observation.evidenceReference });
    if (entity) { entity.observationIds = entity.observationIds.filter(id => id !== observationId); this.refreshAffected([entity.entityId], occurredAt, observationId); }
    return true;
  }

  rebuildProjections() {
    this.ledger.rebuild(); this.projections.clear(); this.index.clear();
    for (const entity of this.entities.values()) { this.index.upsert(entity); this.setProjection(currentEntityProjection(entity, [...this.entities.values()], this.ledger), 1, this.confidenceFor(entity), "1970-01-01T00:00:00.000Z"); }
    for (const event of this.events) if (event.type === "EntityProjectionUpdated") {
      const projection = (event.payload as { projection: IdentityProjection }).projection;
      this.projections.set(projection.entityId, clone(projection));
    }
    return this.projections.size;
  }

  projection(entityId: string) { const value = this.projections.get(entityId); return value ? clone(value) : null; }
  eventPage(cursor: string | null, limit = 50, entityId?: string): Page<ResolutionEvent> { return this.page(entityId ? this.events.filter(event => event.entityId === entityId || this.eventReferencesEntity(event, entityId)) : this.events, cursor, limit); }
  timeline(entityId: string, cursor: string | null, limit = 50): Page<TimelineEntry> { const page = this.eventPage(cursor, limit, entityId); return { data: page.data.map(event => ({ event, decision: this.decisionFor(event) })), nextCursor: page.nextCursor }; }
  indexHealth() { return this.index.health(); }
  metrics(queueBacklog = 0, activeWorkers = 0): RuntimeMetrics {
    const merges = this.events.filter(event => event.type === "EntityMerged").length, splits = this.events.filter(event => event.type === "EntitySplit").length;
    const confidence = this.events.filter(event => event.type === "ConfidenceChanged");
    const drift = confidence.reduce((sum, event) => sum + Number((event.payload as { delta?: number }).delta ?? 0), 0);
    return { queueBacklog, activeWorkers, eventsPerSecond: this.events.length, averageLatencyMs: this.latencySamples.length ? this.latencySamples.reduce((a,b)=>a+b,0)/this.latencySamples.length : 0, confidenceDrift: drift, projectionCacheSize: this.projections.size, indexedValues: this.index.indexedValues, mergeRate: this.events.length ? merges/this.events.length : 0, splitRate: this.events.length ? splits/this.events.length : 0 };
  }

  private attachObservation(entityId: string, observation: Observation) {
    const entity = this.requireEntity(entityId); if (!entity.observationIds.includes(observation.observationId)) entity.observationIds.push(observation.observationId);
    const target = ({ registration_id: entity.registrationIdentifiers, domain: entity.domains, email: entity.emailAddresses, phone: entity.phoneNumbers, name: entity.aliases, address: entity.addresses, director: entity.peopleAndDirectors } as Partial<Record<string,string[]>>)[observation.attribute];
    if (target && !target.includes(observation.observedValue)) target.push(observation.observedValue);
    this.index.upsert(entity);
  }
  private refreshAffected(entityIds: string[], occurredAt: string, correlationId: string) { for (const id of [...new Set(entityIds)].sort()) { const entity=this.entities.get(id); if (!entity) continue; const prior=this.projections.get(id); const confidence=this.confidenceFor(entity); const projection=currentEntityProjection(entity,[...this.entities.values()],this.ledger); this.setProjection(projection,(prior?.version??0)+1,confidence,occurredAt); const next=this.projections.get(id)!; this.publish("EntityProjectionUpdated",entity.workspaceId,id,occurredAt,`${correlationId}:${id}:projection`,{projection:clone(next)}); if(prior&&this.threshold(prior.confidence)!==this.threshold(confidence)) this.publish("ConfidenceChanged",entity.workspaceId,id,occurredAt,`${correlationId}:${id}:confidence`,{previousConfidence:prior.confidence,confidence,delta:Number((confidence-prior.confidence).toFixed(4)),threshold:this.threshold(confidence)}); } }
  private confidenceFor(entity: Entity) { const evidence=entity.observationIds.map(id=>this.observations.get(id)).filter((item):item is Observation=>Boolean(item)); return evidence.length ? Number((evidence.reduce((sum,item)=>sum+item.reliability,0)/evidence.length).toFixed(4)) : 0; }
  private threshold(value:number){return value>=.8?"high":value>=.5?"medium":"low";}
  private setProjection(entity:Entity,version:number,confidence:number,updatedAt:string){this.projections.set(entity.entityId,Object.freeze({...clone(entity),confidence,version,updatedAt}));}
  private publish(type:ResolutionEventType,workspaceId:string,entityId:string|null,occurredAt:string,correlationId:string,payload:Record<string,unknown>){const sequence=this.events.length+1,event=Object.freeze({eventId:stableId(type,workspaceId,correlationId,sequence),schemaVersion:EVENT_SCHEMA_VERSION,sequence,type,workspaceId,entityId,occurredAt,correlationId,payload:Object.freeze(clone(payload))}) satisfies ResolutionEvent;this.events.push(event);return event;}
  private page<T>(items:T[],cursor:string|null,limit:number):Page<T>{const safe=Math.min(Math.max(limit,1),100),start=cursor?Number(Buffer.from(cursor,"base64url").toString("utf8")):0;const data=items.slice(start,start+safe).map(clone);return {data,nextCursor:start+safe<items.length?Buffer.from(String(start+safe)).toString("base64url"):null};}
  private requireEntity(id:string){const entity=this.entities.get(id);if(!entity)throw new Error(`Entity ${id} was not found.`);return entity;}
  private eventReferencesEntity(event:ResolutionEvent,id:string){return JSON.stringify(event.payload).includes(`"${id}"`);}
  private decisionFor(event:ResolutionEvent){const id=(event.payload as {decision?:ResolutionDecision}).decision?.decisionId;return id?clone(this.decisions.get(id)):undefined;}
}

import type { Entity, Observation, ResolutionDecision, ResolverPolicy } from "../entityIntelligence/types";

export const EVENT_SCHEMA_VERSION = 1 as const;

export type ResolutionEventType =
  | "ObservationAdded" | "ObservationUpdated" | "EntityMatched" | "EntitySplit"
  | "EntityMerged" | "EntityProjectionUpdated" | "RelationshipCreated"
  | "RelationshipRemoved" | "ConfidenceChanged" | "EvidenceExpired" | "PolicyChanged";

export type ResolutionEvent<T = Record<string, unknown>> = Readonly<{
  eventId: string;
  schemaVersion: typeof EVENT_SCHEMA_VERSION;
  sequence: number;
  type: ResolutionEventType;
  workspaceId: string;
  entityId: string | null;
  occurredAt: string;
  correlationId: string;
  payload: Readonly<T>;
}>;

export type IdentityIndexAttribute = "registration_id" | "domain" | "email" | "phone" | "alias" | "name" | "address" | "director";
export type IdentityProjection = Readonly<Entity & { confidence: number; version: number; updatedAt: string }>;
export type TimelineEntry = { event: ResolutionEvent; decision?: ResolutionDecision };
export type Page<T> = { data: T[]; nextCursor: string | null };

export type JobReason = "new_observation" | "policy_change" | "source_update" | "evidence_expiration" | "confidence_drift";
export type ResolutionJob = {
  jobId: string;
  idempotencyKey: string;
  reason: JobReason;
  workspaceId: string;
  entityId: string | null;
  observation?: Observation;
  policy?: ResolverPolicy;
  attempts: number;
  maxAttempts: number;
  status: "queued" | "running" | "completed" | "failed";
  error: string | null;
};

export type RuntimeMetrics = {
  queueBacklog: number;
  eventsPerSecond: number;
  averageLatencyMs: number;
  confidenceDrift: number;
  activeWorkers: number;
  projectionCacheSize: number;
  indexedValues: number;
  mergeRate: number;
  splitRate: number;
};

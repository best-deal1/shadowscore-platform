/**
 * Workspace domain contracts. These types are persistence-agnostic so M1 can
 * introduce repositories without changing the UI or route-handler boundary.
 */

export type IsoTimestamp = string;
export type Uuid = string;
export type OpaqueCaseId = string;

export type MembershipRole = "owner" | "manager" | "analyst" | "viewer";
export type MembershipStatus = "active" | "disabled";
export type CaseStatus =
  | "draft"
  | "active"
  | "awaiting_input"
  | "under_review"
  | "monitoring"
  | "closed"
  | "archived";
export type CasePriority = "low" | "normal" | "high" | "critical";
export type TaskStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";
export type AlertState = "open" | "acknowledged" | "resolved" | "suppressed";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type FindingKind = "positive" | "risk" | "contradiction" | "gap" | "analyst_note";
export type DecisionOutcome = "pass" | "proceed_with_verification" | "review" | "fail" | "no_decision";

export interface Organization {
  id: Uuid;
  name: string;
  plan: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface OrganizationMembership {
  organizationId: Uuid;
  userId: Uuid;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface Case {
  id: Uuid;
  publicId: OpaqueCaseId;
  organizationId: Uuid;
  investigationId: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  ownerId: Uuid | null;
  dueAt: IsoTimestamp | null;
  version: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface CaseTask {
  id: Uuid;
  caseId: Uuid;
  title: string;
  status: TaskStatus;
  assigneeId: Uuid | null;
  dueAt: IsoTimestamp | null;
  evidenceRefs: readonly Uuid[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface WorkspaceAlert {
  id: Uuid;
  caseId: Uuid;
  subscriptionId: Uuid;
  dedupeKey: string;
  severity: AlertSeverity;
  state: AlertState;
  firstSeenAt: IsoTimestamp;
  lastSeenAt: IsoTimestamp;
}

export interface TimelineEvent {
  id: Uuid;
  caseId: Uuid;
  occurredAt: IsoTimestamp;
  recordedAt: IsoTimestamp;
  eventType: string;
  actorType: "user" | "system" | "provider";
  actorId: Uuid | null;
  payload: Record<string, unknown>;
}

export type TimelineCategory = "all" | "case" | "evidence" | "finding" | "analyst" | "decision" | "monitoring" | "report";

/** Safe activity data intended for the browser. It never includes raw provider output. */
export interface TimelineEventDto {
  id: string;
  occurredAt: IsoTimestamp;
  recordedAt: IsoTimestamp;
  eventType: string;
  category: Exclude<TimelineCategory, "all">;
  actorType: TimelineEvent["actorType"];
  actorId: string | null;
  title: string;
  detail: string | null;
  referenceIds: readonly string[];
}

export interface TimelinePageDto {
  events: readonly TimelineEventDto[];
  nextCursor: string | null;
}

/** A browser-safe queue representation. It deliberately excludes raw evidence and provider output. */
export interface CaseQueueItemDto {
  id: OpaqueCaseId;
  title: string;
  target: string;
  status: CaseStatus;
  priority: CasePriority;
  ownerName: string | null;
  dueAt: IsoTimestamp | null;
  updatedAt: IsoTimestamp;
  openAlertCount: number;
}

export interface CaseQueueDto {
  cases: readonly CaseQueueItemDto[];
  nextCursor: string | null;
}

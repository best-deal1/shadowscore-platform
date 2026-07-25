import type { TimelineCategory, TimelinePageDto } from "./domain";
import type { WorkspaceActor } from "./actor";

export class TimelineAccessError extends Error {}
export class TimelineNotFoundError extends Error {}
export class TimelineValidationError extends Error {}

export type TimelineQuery = { category?: TimelineCategory; cursor?: string; limit?: number };
export interface TimelineStore {
  list(actor: WorkspaceActor, publicCaseId: string, query: Required<TimelineQuery>): Promise<TimelinePageDto | null>;
}

const readableRoles = new Set(["owner", "manager", "analyst", "viewer"]);

export function normalizeTimelineQuery(query: TimelineQuery): Required<TimelineQuery> {
  const category = query.category ?? "all";
  if (!new Set<TimelineCategory>(["all", "case", "evidence", "finding", "analyst", "decision", "monitoring", "report"]).has(category)) {
    throw new TimelineValidationError("Timeline category is invalid.");
  }
  const limit = query.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TimelineValidationError("Timeline limit must be between 1 and 100.");
  if (query.cursor !== undefined && !/^[A-Za-z0-9_-]{1,500}$/.test(query.cursor)) throw new TimelineValidationError("Timeline cursor is invalid.");
  return { category, cursor: query.cursor ?? "", limit };
}

export class TimelineService {
  private readonly store: TimelineStore;

  constructor(store: TimelineStore) { this.store = store; }

  async list(actor: WorkspaceActor, publicCaseId: string, query: TimelineQuery = {}): Promise<TimelinePageDto> {
    if (!readableRoles.has(actor.role)) throw new TimelineAccessError("This role cannot view the activity timeline.");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(publicCaseId)) throw new TimelineValidationError("Case identifier is invalid.");
    const page = await this.store.list(actor, publicCaseId, normalizeTimelineQuery(query));
    if (!page) throw new TimelineNotFoundError("Case not found.");
    return page;
  }
}

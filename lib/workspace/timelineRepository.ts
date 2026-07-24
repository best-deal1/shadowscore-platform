import type { TimelineCategory, TimelineEventDto, TimelinePageDto } from "./domain.ts";
import type { WorkspaceActor } from "./actor.ts";
import type { TimelineStore } from "./timeline.ts";

type TimelineRow = { id: string; occurred_at: string; recorded_at: string; event_type: string; actor_type: TimelineEventDto["actorType"]; actor_id: string | null; payload: Record<string, unknown>; reference_ids: string[] | null };
export type TimelineRepositoryRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

const categoryFor = (eventType: string): Exclude<TimelineCategory, "all"> => {
  const prefix = eventType.split(".")[0];
  if (prefix === "case" || prefix === "task") return "case";
  if (prefix === "evidence" || prefix === "relationship") return "evidence";
  if (prefix === "finding") return "finding";
  if (prefix === "comment" || prefix === "note") return "analyst";
  if (prefix === "decision") return "decision";
  if (prefix === "alert" || prefix === "subscription" || prefix === "monitoring") return "monitoring";
  return "report";
};

function text(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback; }
function toDto(row: TimelineRow): TimelineEventDto {
  return { id: row.id, occurredAt: row.occurred_at, recordedAt: row.recorded_at, eventType: row.event_type, category: categoryFor(row.event_type), actorType: row.actor_type, actorId: row.actor_id, title: text(row.payload?.title, row.event_type.replaceAll(".", " ")), detail: typeof row.payload?.detail === "string" ? row.payload.detail.slice(0, 2000) : null, referenceIds: Array.isArray(row.reference_ids) ? row.reference_ids : [] };
}

function encodeCursor(event: TimelineEventDto) { return Buffer.from(`${event.occurredAt}|${event.id}`).toString("base64url"); }
function decodeCursor(cursor: string): { occurredAt: string; id: string } | null {
  if (!cursor) return null;
  const [occurredAt, id, extra] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  return !extra && occurredAt && id && !Number.isNaN(Date.parse(occurredAt)) && /^[0-9a-f-]{16,}$/i.test(id) ? { occurredAt, id } : null;
}

export class TimelineRepository implements TimelineStore {
  private readonly request: TimelineRepositoryRequest;
  private readonly accessToken: string;

  constructor(request: TimelineRepositoryRequest, accessToken: string) {
    this.request = request;
    this.accessToken = accessToken;
  }

  async list(actor: WorkspaceActor, publicCaseId: string, query: { category: TimelineCategory; cursor: string; limit: number }): Promise<TimelinePageDto | null> {
    const cases = await this.request<{ id: string }[]>(`/rest/v1/cases?select=id&public_id=eq.${encodeURIComponent(publicCaseId)}&organization_id=eq.${encodeURIComponent(actor.organizationId)}&limit=1`, {}, this.accessToken);
    if (!cases[0]) return null;
    const filters = [`case_id=eq.${encodeURIComponent(cases[0].id)}`, "order=occurred_at.desc,id.desc", `limit=${query.limit + 1}`];
    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) return { events: [], nextCursor: null };
    if (cursor) filters.push(`or=${encodeURIComponent(`(occurred_at.lt.${cursor.occurredAt},and(occurred_at.eq.${cursor.occurredAt},id.lt.${cursor.id}))`)}`);
    const rows = await this.request<TimelineRow[]>(`/rest/v1/timeline_events?select=id,occurred_at,recorded_at,event_type,actor_type,actor_id,payload,reference_ids&${filters.join("&")}`, {}, this.accessToken);
    const events = rows.map(toDto).filter((event) => query.category === "all" || event.category === query.category);
    const page = events.slice(0, query.limit);
    return { events: page, nextCursor: rows.length > query.limit && page.length ? encodeCursor(page[page.length - 1]) : null };
  }
}

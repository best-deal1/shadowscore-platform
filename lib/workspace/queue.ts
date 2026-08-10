import type { WorkspaceActor } from "./actor";
import type { CasePriority, CaseQueueDto, CaseQueueItemDto, CaseStatus } from "./domain";

type QueueCaseRow = { public_id: string; title: string; investigation_id: string; status: CaseStatus; priority: CasePriority; due_at: string | null; version: number; updated_at: string };
export type QueueRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

// Keep the workspace's initial request limited to columns on cases. PostgREST
// rejects an embedded relation when its schema cache does not contain the named
// foreign key, which turns the page's Server Component render into an error.
const queueSelect = "public_id,title,investigation_id,status,priority,due_at,version,updated_at";

function toQueueItem(row: QueueCaseRow): CaseQueueItemDto {
  return { id: row.public_id, investigationId: row.investigation_id, title: row.title, target: row.investigation_id, status: row.status, priority: row.priority, ownerName: null, dueAt: row.due_at, version: row.version, updatedAt: row.updated_at, openAlertCount: 0 };
}

export async function fetchOrganizationQueue(actor: Pick<WorkspaceActor, "organizationId">, accessToken: string, request: QueueRequest): Promise<CaseQueueDto> {
  const organizationId = encodeURIComponent(actor.organizationId);
  const rows = await request<QueueCaseRow[]>(`/rest/v1/cases?select=${encodeURIComponent(queueSelect)}&organization_id=eq.${organizationId}&order=updated_at.desc`, {}, accessToken);
  return { cases: rows.map(toQueueItem), nextCursor: null };
}

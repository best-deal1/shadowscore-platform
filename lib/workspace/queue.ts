import type { WorkspaceActor } from "./actor";
import type { CasePriority, CaseQueueDto, CaseQueueItemDto, CaseStatus } from "./domain";

type QueueCaseRow = { public_id: string; title: string; investigation_id: string; status: CaseStatus; priority: CasePriority; due_at: string | null; updated_at: string; owner: { full_name: string | null } | null };
export type QueueRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

const queueSelect = "public_id,title,investigation_id,status,priority,due_at,updated_at,owner:profiles!cases_owner_id_fkey(full_name)";

function toQueueItem(row: QueueCaseRow): CaseQueueItemDto {
  return { id: row.public_id, title: row.title, target: row.investigation_id, status: row.status, priority: row.priority, ownerName: row.owner?.full_name ?? null, dueAt: row.due_at, updatedAt: row.updated_at, openAlertCount: 0 };
}

export async function fetchOrganizationQueue(actor: Pick<WorkspaceActor, "organizationId">, accessToken: string, request: QueueRequest): Promise<CaseQueueDto> {
  const organizationId = encodeURIComponent(actor.organizationId);
  const rows = await request<QueueCaseRow[]>(`/rest/v1/cases?select=${encodeURIComponent(queueSelect)}&organization_id=eq.${organizationId}&order=updated_at.desc`, {}, accessToken);
  return { cases: rows.map(toQueueItem), nextCursor: null };
}

import type { Case } from "./domain";
import type { WorkspaceActor } from "./actor";
import type { CaseStore, CreateCaseInput, UpdateCaseInput } from "./cases";

type CaseRow = { id: string; public_id: string; organization_id: string; investigation_id: string; title: string; status: Case["status"]; priority: Case["priority"]; owner_id: string | null; due_at: string | null; version: number; created_at: string; updated_at: string };
export type CaseRepositoryRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

function mapRow(row: CaseRow): Case {
  return { id: row.id, publicId: row.public_id, organizationId: row.organization_id, investigationId: row.investigation_id, title: row.title, status: row.status, priority: row.priority, ownerId: row.owner_id, dueAt: row.due_at, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at };
}

export class CaseRepository implements CaseStore {
  private readonly request: CaseRepositoryRequest;
  private readonly accessToken: string;

  constructor(request: CaseRepositoryRequest, accessToken: string) {
    this.request = request;
    this.accessToken = accessToken;
  }

  async list(actor: WorkspaceActor): Promise<Case[]> {
    const rows = await this.request<CaseRow[]>(`/rest/v1/cases?select=*&organization_id=eq.${encodeURIComponent(actor.organizationId)}`, {}, this.accessToken);
    return rows.map(mapRow);
  }
  async findById(actor: WorkspaceActor, publicId: string): Promise<Case | null> {
    const rows = await this.request<CaseRow[]>(`/rest/v1/cases?select=*&public_id=eq.${encodeURIComponent(publicId)}&organization_id=eq.${encodeURIComponent(actor.organizationId)}&limit=1`, {}, this.accessToken);
    return rows[0] ? mapRow(rows[0]) : null;
  }
  async create(actor: WorkspaceActor, input: CreateCaseInput): Promise<Case> {
    const row = await this.request<CaseRow[]>("/rest/v1/cases", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ organization_id: actor.organizationId, investigation_id: input.investigationId, title: input.title, priority: input.priority, due_at: input.dueAt ?? null, owner_id: actor.userId }) }, this.accessToken);
    return mapRow(row[0]);
  }
  async update(actor: WorkspaceActor, publicId: string, input: UpdateCaseInput, expectedVersion: number): Promise<Case | null> {
    const payload = { ...(input.title === undefined ? {} : { title: input.title }), ...(input.priority === undefined ? {} : { priority: input.priority }), ...(input.dueAt === undefined ? {} : { due_at: input.dueAt }), ...(input.status === undefined ? {} : { status: input.status }) };
    const rows = await this.request<CaseRow[]>(`/rest/v1/cases?public_id=eq.${encodeURIComponent(publicId)}&organization_id=eq.${encodeURIComponent(actor.organizationId)}&version=eq.${expectedVersion}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) }, this.accessToken);
    return rows[0] ? mapRow(rows[0]) : null;
  }
  async delete(actor: WorkspaceActor, publicId: string): Promise<boolean> {
    const rows = await this.request<Pick<CaseRow, "id">[]>(`/rest/v1/cases?public_id=eq.${encodeURIComponent(publicId)}&organization_id=eq.${encodeURIComponent(actor.organizationId)}&select=id`, { method: "DELETE", headers: { Prefer: "return=representation" } }, this.accessToken);
    return rows.length === 1;
  }
}

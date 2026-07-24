import type { Case, CasePriority, CaseStatus } from "./domain.ts";
import type { WorkspaceActor } from "./actor.ts";

export type CaseDto = {
  id: string;
  investigationId: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCaseInput = { investigationId: string; title: string; priority: CasePriority; dueAt?: string | null };
export type UpdateCaseInput = { title?: string; priority?: CasePriority; dueAt?: string | null; status?: CaseStatus };

export class CaseValidationError extends Error {}
export class CaseAccessError extends Error {}
export class CaseNotFoundError extends Error {}

export interface CaseStore {
  list(actor: WorkspaceActor): Promise<Case[]>;
  findById(actor: WorkspaceActor, publicId: string): Promise<Case | null>;
  create(actor: WorkspaceActor, input: CreateCaseInput): Promise<Case>;
  update(actor: WorkspaceActor, publicId: string, input: UpdateCaseInput): Promise<Case | null>;
}

const priorities = new Set<CasePriority>(["low", "normal", "high", "critical"]);
const writableRoles = new Set(["analyst", "manager", "owner"]);

function validDueAt(dueAt: string | null | undefined) {
  return dueAt === undefined || dueAt === null || (!Number.isNaN(Date.parse(dueAt)) && new Date(dueAt).toISOString() === dueAt);
}

function assertInput(input: CreateCaseInput | UpdateCaseInput) {
  if ("priority" in input && input.priority !== undefined && !priorities.has(input.priority)) throw new CaseValidationError("Priority is invalid.");
  if (!validDueAt(input.dueAt)) throw new CaseValidationError("Due date must be an ISO timestamp.");
}

export function toCaseDto(caseRecord: Case): CaseDto {
  return { id: caseRecord.publicId, investigationId: caseRecord.investigationId, title: caseRecord.title, status: caseRecord.status, priority: caseRecord.priority, dueAt: caseRecord.dueAt, createdAt: caseRecord.createdAt, updatedAt: caseRecord.updatedAt };
}

export class CaseService {
  private readonly store: CaseStore;

  constructor(store: CaseStore) {
    this.store = store;
  }

  async create(actor: WorkspaceActor, input: CreateCaseInput): Promise<CaseDto> {
    if (!writableRoles.has(actor.role)) throw new CaseAccessError("This role cannot create cases.");
    assertInput(input);
    return toCaseDto(await this.store.create(actor, input));
  }

  async get(actor: WorkspaceActor, publicId: string): Promise<CaseDto> {
    const caseRecord = await this.store.findById(actor, publicId);
    if (!caseRecord) throw new CaseNotFoundError("Case not found.");
    return toCaseDto(caseRecord);
  }

  async update(actor: WorkspaceActor, publicId: string, input: UpdateCaseInput): Promise<CaseDto> {
    if (!writableRoles.has(actor.role)) throw new CaseAccessError("This role cannot update cases.");
    assertInput(input);
    const caseRecord = await this.store.update(actor, publicId, input);
    if (!caseRecord) throw new CaseNotFoundError("Case not found.");
    return toCaseDto(caseRecord);
  }
}

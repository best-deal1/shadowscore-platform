import type { Case, CasePriority, CaseStatus } from "./domain";
import type { WorkspaceActor } from "./actor";

export type CaseDto = {
  id: string;
  investigationId: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  dueAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCaseInput = { investigationId: string; title: string; priority: CasePriority; dueAt?: string | null };
export type UpdateCaseInput = { version: number; title?: string; priority?: CasePriority; dueAt?: string | null; status?: CaseStatus };

export class CaseValidationError extends Error {}
export class CaseAccessError extends Error {}
export class CaseNotFoundError extends Error {}
export class CaseConflictError extends Error {}

export interface CaseStore {
  list(actor: WorkspaceActor): Promise<Case[]>;
  findById(actor: WorkspaceActor, publicId: string): Promise<Case | null>;
  create(actor: WorkspaceActor, input: CreateCaseInput): Promise<Case>;
  update(actor: WorkspaceActor, publicId: string, input: UpdateCaseInput, expectedVersion: number): Promise<Case | null>;
  delete(actor: WorkspaceActor, publicId: string): Promise<boolean>;
}

const priorities = new Set<CasePriority>(["low", "normal", "high", "critical"]);
const writableRoles = new Set(["analyst", "manager", "owner"]);
const workflowTransitions: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = {
  draft: ["active"],
  active: ["awaiting_input", "under_review"],
  awaiting_input: ["active"],
  under_review: ["monitoring", "closed"],
  monitoring: ["closed", "archived"],
  closed: ["archived"],
  archived: ["closed"],
};

function validDueAt(dueAt: string | null | undefined) {
  return dueAt === undefined || dueAt === null || (!Number.isNaN(Date.parse(dueAt)) && new Date(dueAt).toISOString() === dueAt);
}

function assertInput(input: CreateCaseInput | UpdateCaseInput) {
  if ("priority" in input && input.priority !== undefined && !priorities.has(input.priority)) throw new CaseValidationError("Priority is invalid.");
  if (!validDueAt(input.dueAt)) throw new CaseValidationError("Due date must be an ISO timestamp.");
  if ("version" in input && (!Number.isInteger(input.version) || input.version < 1)) throw new CaseValidationError("Version must be a positive integer.");
}

function assertWorkflowTransition(from: CaseStatus, to: CaseStatus | undefined) {
  if (to !== undefined && to !== from && !workflowTransitions[from].includes(to)) {
    throw new CaseValidationError(`Cannot transition a case from ${from} to ${to}.`);
  }
}

export function toCaseDto(caseRecord: Case): CaseDto {
  return { id: caseRecord.publicId, investigationId: caseRecord.investigationId, title: caseRecord.title, status: caseRecord.status, priority: caseRecord.priority, dueAt: caseRecord.dueAt, version: caseRecord.version, createdAt: caseRecord.createdAt, updatedAt: caseRecord.updatedAt };
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
    const currentCase = await this.store.findById(actor, publicId);
    if (!currentCase) throw new CaseNotFoundError("Case not found.");
    assertWorkflowTransition(currentCase.status, input.status);
    const caseRecord = await this.store.update(actor, publicId, input, input.version);
    if (!caseRecord) throw new CaseConflictError("Case was changed by another request.");
    return toCaseDto(caseRecord);
  }

  async delete(actor: WorkspaceActor, publicId: string): Promise<void> {
    if (!writableRoles.has(actor.role)) throw new CaseAccessError("This role cannot delete investigations.");
    if (!publicId.trim()) throw new CaseValidationError("An investigation ID is required.");
    if (!await this.store.delete(actor, publicId)) throw new CaseNotFoundError("Investigation not found.");
  }
}

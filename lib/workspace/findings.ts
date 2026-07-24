import type { EvidenceItemSummary, Finding, FindingConfidence, FindingSeverity } from "./domain.ts";
import type { WorkspaceActor } from "./actor.ts";

export type FindingDto = Omit<Finding, "caseId" | "organizationId" | "createdBy" | "updatedBy">;
export type FindingInput = { title: string; narrative: string; severity: FindingSeverity; confidence: FindingConfidence; tags: string[]; evidenceIds: string[] };
export type UpdateFindingInput = FindingInput & { version: number };
export type FindingsWorkspaceDto = { findings: FindingDto[]; evidence: EvidenceItemSummary[] };
export class FindingValidationError extends Error {}
export class FindingAccessError extends Error {}
export class FindingNotFoundError extends Error {}
export class FindingConflictError extends Error {}

export interface FindingStore {
  list(actor: WorkspaceActor, caseId: string): Promise<FindingsWorkspaceDto | null>;
  create(actor: WorkspaceActor, caseId: string, input: FindingInput): Promise<Finding | null>;
  update(actor: WorkspaceActor, caseId: string, findingId: string, input: UpdateFindingInput): Promise<Finding | "conflict" | null>;
  delete(actor: WorkspaceActor, caseId: string, findingId: string, version: number): Promise<"deleted" | "conflict" | null>;
}
const writable = new Set(["owner", "manager", "analyst"]);
const severities = new Set(["informational", "low", "medium", "high", "critical"]);
const confidences = new Set(["low", "medium", "high"]);
const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
function validate(input: FindingInput | UpdateFindingInput) {
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.trim().length > 160) throw new FindingValidationError("Title must contain 3 to 160 characters.");
  if (typeof input.narrative !== "string" || input.narrative.trim().length < 10 || input.narrative.trim().length > 10000) throw new FindingValidationError("Narrative must contain 10 to 10,000 characters.");
  if (!severities.has(input.severity)) throw new FindingValidationError("Severity is invalid.");
  if (!confidences.has(input.confidence)) throw new FindingValidationError("Confidence is invalid.");
  if (!Array.isArray(input.evidenceIds) || input.evidenceIds.length < 1 || input.evidenceIds.length > 100 || input.evidenceIds.some((id) => typeof id !== "string" || !idPattern.test(id))) throw new FindingValidationError("Select at least one valid evidence item.");
  if (!Array.isArray(input.tags) || input.tags.length > 20 || input.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.trim().length > 40)) throw new FindingValidationError("Tags are invalid.");
  if ("version" in input && (!Number.isInteger(input.version) || input.version < 1)) throw new FindingValidationError("Version is invalid.");
}
function clean(input: FindingInput): FindingInput { return { ...input, title: input.title.trim(), narrative: input.narrative.trim(), tags: [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()))], evidenceIds: [...new Set(input.evidenceIds)] }; }
function dto(record: Finding): FindingDto { return { id: record.id, publicId: record.publicId, title: record.title, narrative: record.narrative, severity: record.severity, confidence: record.confidence, tags: record.tags, evidence: record.evidence, version: record.version, createdAt: record.createdAt, updatedAt: record.updatedAt }; }
export class FindingService {
  private readonly store: FindingStore;
  constructor(store: FindingStore) { this.store = store; }
  async list(actor: WorkspaceActor, caseId: string) { if (!idPattern.test(caseId)) throw new FindingValidationError("Case identifier is invalid."); const result = await this.store.list(actor, caseId); if (!result) throw new FindingNotFoundError("Case not found."); return result; }
  async create(actor: WorkspaceActor, caseId: string, input: FindingInput) { if (!writable.has(actor.role)) throw new FindingAccessError("This role cannot create findings."); validate(input); const result = await this.store.create(actor, caseId, clean(input)); if (!result) throw new FindingNotFoundError("Case or evidence item not found."); return dto(result); }
  async update(actor: WorkspaceActor, caseId: string, findingId: string, input: UpdateFindingInput) { if (!writable.has(actor.role)) throw new FindingAccessError("This role cannot update findings."); validate(input); const result = await this.store.update(actor, caseId, findingId, { ...clean(input), version: input.version }); if (result === "conflict") throw new FindingConflictError("Finding was changed by another request."); if (!result) throw new FindingNotFoundError("Finding, case, or evidence item not found."); return dto(result); }
  async delete(actor: WorkspaceActor, caseId: string, findingId: string, version: number) { if (!writable.has(actor.role)) throw new FindingAccessError("This role cannot delete findings."); if (!Number.isInteger(version) || version < 1) throw new FindingValidationError("Version is invalid."); const result = await this.store.delete(actor, caseId, findingId, version); if (result === "conflict") throw new FindingConflictError("Finding was changed by another request."); if (!result) throw new FindingNotFoundError("Finding not found."); }
}

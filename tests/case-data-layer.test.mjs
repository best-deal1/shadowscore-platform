import assert from "node:assert/strict";
import { CaseRepository } from "../lib/workspace/caseRepository.ts";
import { CaseAccessError, CaseConflictError, CaseNotFoundError, CaseService, CaseValidationError } from "../lib/workspace/cases.ts";
import { createCaseRouteHandlers } from "../lib/workspace/caseRoutes.ts";

const timestamp = "2026-07-24T00:00:00.000Z";
const actor = (organizationId = "org-a", role = "analyst") => ({ userId: "user-a", organizationId, role, name: "Alex", email: "alex@example.com" });
const row = (organization_id = "org-a", public_id = "case-a") => ({ id: "internal-id", public_id, organization_id, investigation_id: "target-a", title: "Case A", status: "draft", priority: "normal", owner_id: "user-a", due_at: null, version: 1, created_at: timestamp, updated_at: timestamp });

class MemoryStore {
  constructor(records = [row()]) { this.records = records; }
  async list(currentActor) { return this.records.filter((record) => record.organization_id === currentActor.organizationId).map(toCase); }
  async findById(currentActor, publicId) { const record = this.records.find((item) => item.organization_id === currentActor.organizationId && item.public_id === publicId); return record ? toCase(record) : null; }
  async create(currentActor, input) { const record = row(currentActor.organizationId, "case-created"); Object.assign(record, { investigation_id: input.investigationId, title: input.title, priority: input.priority, due_at: input.dueAt ?? null }); this.records.push(record); return toCase(record); }
  async update(currentActor, publicId, input, expectedVersion) { const record = this.records.find((item) => item.organization_id === currentActor.organizationId && item.public_id === publicId && item.version === expectedVersion); if (!record) return null; Object.assign(record, { ...input, due_at: input.dueAt, version: record.version + 1 }); return toCase(record); }
}
function toCase(record) { return { id: record.id, publicId: record.public_id, organizationId: record.organization_id, investigationId: record.investigation_id, title: record.title, status: record.status, priority: record.priority, ownerId: record.owner_id, dueAt: record.due_at, version: record.version, createdAt: record.created_at, updatedAt: record.updated_at }; }

const store = new MemoryStore();
const service = new CaseService(store);
const created = await service.create(actor(), { investigationId: "target-new", title: "Valid case", priority: "high", dueAt: timestamp });
assert.equal(created.id, "case-created");
assert.equal("organizationId" in created, false);
assert.equal("id" in created && created.id === "internal-id", false);
await assert.rejects(() => service.create(actor(), { investigationId: "target", title: "Invalid", priority: "urgent" }), CaseValidationError);
await assert.rejects(() => service.create(actor(), { investigationId: "target", title: "Invalid", priority: "normal", dueAt: "tomorrow" }), CaseValidationError);
for (const role of ["viewer"]) await assert.rejects(() => service.create(actor("org-a", role), { investigationId: "target", title: "Denied", priority: "normal" }), CaseAccessError);
for (const role of ["analyst", "manager", "owner"]) assert.equal((await service.create(actor("org-a", role), { investigationId: "target", title: role, priority: "normal" })).title, role);
await assert.rejects(() => service.update(actor("org-a", "viewer"), "case-a", { version: 1, title: "Denied" }), CaseAccessError);
await assert.rejects(() => service.update(actor(), "case-a", { version: 1, status: "archived" }), CaseValidationError);
await service.update(actor(), "case-a", { version: 1, status: "active" });
await service.update(actor(), "case-a", { version: 2, status: "under_review" });
await service.update(actor(), "case-a", { version: 3, status: "monitoring" });
await service.update(actor(), "case-a", { version: 4, status: "archived" });
await assert.rejects(() => service.update(actor(), "case-a", { version: 5, status: "closed" }), CaseValidationError);
const closedStore = new MemoryStore([{ ...row(), status: "closed" }]);
await new CaseService(closedStore).update(actor(), "case-a", { version: 1, status: "archived" });

const paths = [];
const bodies = [];
const repository = new CaseRepository(async (path, init = {}) => { paths.push(path); if (init.body) bodies.push(JSON.parse(init.body)); return init.method === "POST" ? [row("org-a", "case-created")] : init.method === "PATCH" ? [row()] : [row()]; }, "token");
await repository.list(actor());
await repository.findById(actor(), "case-a");
await repository.create(actor(), { investigationId: "target", title: "Created", priority: "normal" });
await repository.update(actor(), "case-a", { version: 1, title: "Updated", organization_id: "org-b" }, 1);
assert.match(paths[0], /organization_id=eq\.org-a/);
assert.match(paths[1], /public_id=eq\.case-a.*organization_id=eq\.org-a/);
assert.equal(bodies[0].organization_id, "org-a");
assert.equal("organization_id" in bodies[1], false);
assert.match(paths[3], /version=eq\.1/);

const isolated = new CaseService(new MemoryStore([row("org-b", "case-b")]));
await assert.rejects(() => isolated.get(actor("org-a"), "case-b"), CaseNotFoundError);
await assert.rejects(() => isolated.update(actor("org-a"), "case-b", { version: 1, title: "Cross-org" }), CaseNotFoundError);

const route = (routeService, resolveActor = async (token) => { if (!token) throw new CaseAccessError("A workspace session is required."); return actor(); }) => createCaseRouteHandlers({ resolveActor, service: () => routeService });
const request = (body, authorization = "Bearer token") => new Request("http://localhost/api/cases", { method: "POST", headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body) });
const patchRequest = (body) => new Request("http://localhost/api/cases/case-a", { method: "PATCH", headers: { "content-type": "application/json", authorization: "Bearer token" }, body: JSON.stringify(body) });
assert.equal((await route(service).POST(request({ title: "Case", investigationId: "target", priority: "normal" }, ""))).status, 401);
assert.equal((await route(service).POST(request({ title: "Case", investigationId: "target", priority: "bad" }))).status, 400);
assert.equal((await route(service).GET(new Request("http://localhost", { headers: { authorization: "Bearer token" } }), "missing")).status, 404);
assert.equal((await route(service).POST(request({ title: "API case", investigationId: "target", priority: "normal" }))).status, 201);
const staleStore = new MemoryStore([row()]);
const staleService = new CaseService(staleStore);
await staleStore.update(actor(), "case-a", { version: 1, title: "Updated elsewhere" }, 1);
assert.equal((await route(staleService).PATCH(patchRequest({ version: 1, title: "Stale update" }), "case-a")).status, 409);
await assert.rejects(() => staleService.update(actor(), "case-a", { version: 1, title: "Stale update" }), CaseConflictError);
assert.equal((await route({ create: async () => { throw new Error("database down"); } }).POST(request({ title: "Failure", investigationId: "target", priority: "normal" }))).status, 500);

console.log("case data layer behavioral tests passed");

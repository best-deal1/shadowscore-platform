import test from "node:test";
import assert from "node:assert/strict";
import { CaseAccessError, CaseNotFoundError, CaseService } from "../lib/workspace/cases.ts";
import { CaseRepository } from "../lib/workspace/caseRepository.ts";
import { readFile } from "node:fs/promises";
import { deleteWorkspaceInvestigations, intersectVisibleSelection, reconcileDeletionResults } from "../lib/workspace/bulkDeletion.ts";

const caseRecord = { id: "internal", publicId: "case-1", organizationId: "org-1", investigationId: "inv-1", title: "Acme", status: "active", priority: "normal", ownerId: "user-1", dueAt: null, version: 1, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" };
const actor = (role = "owner") => ({ userId: "user-1", organizationId: "org-1", email: "owner@example.com", role });

class Store {
  deleted = false;
  async list() { return [caseRecord]; }
  async findById() { return caseRecord; }
  async create() { return caseRecord; }
  async update() { return caseRecord; }
  async delete(_actor, publicId) { this.deleted = publicId === caseRecord.publicId; return this.deleted; }
}

for (const role of ["owner", "manager", "analyst"]) {
  test(`${role} can delete an investigation`, async () => {
    const store = new Store();
    await new CaseService(store).delete(actor(role), "case-1");
    assert.equal(store.deleted, true);
  });
}

test("viewers cannot delete investigations", async () => {
  await assert.rejects(() => new CaseService(new Store()).delete(actor("viewer"), "case-1"), CaseAccessError);
});

test("missing investigations return a not-found error", async () => {
  const store = new Store();
  store.findById = async () => null;
  await assert.rejects(() => new CaseService(store).delete(actor(), "missing"), CaseNotFoundError);
  assert.equal(store.deleted, false);
});

test("the displayed case public ID and actor organization are passed exactly to the deletion RPC", async () => {
  let request;
  const repository = new CaseRepository(async (path, init) => { request = { path, init }; return true; }, "token");
  assert.equal(await repository.delete(actor(), "case-1"), true);
  assert.equal(request.path, "/rest/v1/rpc/delete_workspace_case");
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(request.init.body), { p_public_id: caseRecord.publicId, p_organization_id: "org-1" });
});

test("zero-row deletion returns failure", async () => {
  const repository = new CaseRepository(async () => false, "token");
  assert.equal(await repository.delete(actor(), "missing"), false);
});

test("a cross-tenant RPC deletion returns false", async () => {
  const repository = new CaseRepository(async (_path, init) => {
    const parameters = JSON.parse(init.body);
    return parameters.p_public_id === caseRecord.publicId && parameters.p_organization_id === caseRecord.organizationId;
  }, "token");

  assert.equal(await repository.delete({ ...actor(), organizationId: "org-2" }, caseRecord.publicId), false);
});

test("a refreshed workspace no longer lists the deleted case", async () => {
  const records = [caseRecord];
  const repository = new CaseRepository(async (path, init) => {
    if (path === "/rest/v1/rpc/delete_workspace_case") {
      const { p_public_id, p_organization_id } = JSON.parse(init.body);
      const index = records.findIndex((item) => item.publicId === p_public_id && item.organizationId === p_organization_id);
      if (index === -1) return false;
      records.splice(index, 1);
      return true;
    }
    return records.map((item) => ({ id: item.id, public_id: item.publicId, organization_id: item.organizationId, investigation_id: item.investigationId, title: item.title, status: item.status, priority: item.priority, owner_id: item.ownerId, due_at: item.dueAt, version: item.version, created_at: item.createdAt, updated_at: item.updatedAt }));
  }, "token");

  assert.equal(await repository.delete(actor(), caseRecord.publicId), true);
  assert.deepEqual(await repository.list(actor()), []);
});

test("the deletion RPC enforces role, tenant, authentication, and execution contracts", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260815010000_delete_workspace_case_rpc.sql", import.meta.url), "utf8");
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /membership\.organization_id = p_organization_id/i);
  assert.match(migration, /membership\.status = 'active'/i);
  assert.match(migration, /membership\.role in \('owner', 'manager', 'analyst'\)/i);
  assert.match(migration, /public_id = p_public_id\s+and organization_id = p_organization_id/i);
  assert.match(migration, /revoke all on function public\.delete_workspace_case\(text, uuid\) from public/i);
  assert.match(migration, /grant execute on function public\.delete_workspace_case\(text, uuid\) to authenticated/i);
  assert.doesNotMatch(migration, /'viewer'/i);
});

test("bulk deletion submits only selected investigations that remain visible", () => {
  const selected = new Set(["case-1", "case-2"]);
  const visibleAfterSearch = new Set(["case-2", "case-3"]);
  assert.deepEqual(intersectVisibleSelection(selected, visibleAfterSearch), ["case-2"]);
});

test("partial bulk deletion keeps only failed IDs available for retry and defers refresh", () => {
  const outcome = reconcileDeletionResults([
    { id: "case-1", ok: true, error: null, status: 204, retryable: false },
    { id: "case-2", ok: false, error: "Record is locked", status: 409, retryable: true },
  ]);
  assert.deepEqual(outcome.removedIds, ["case-1"]);
  assert.deepEqual(outcome.failedIds, ["case-2"]);
  assert.equal(outcome.error, "case-2: Record is locked");
  assert.equal(outcome.canRetry, true);
  assert.equal(outcome.shouldRefresh, false);

  assert.deepEqual(intersectVisibleSelection(outcome.failedIds, new Set(["case-2"])), ["case-2"]);
});

test("bulk deletion retry submits only genuinely retryable failed IDs", async () => {
  const submitted = [];
  const firstAttempt = await deleteWorkspaceInvestigations(["case-1", "case-2", "case-3"], async (id) => {
    submitted.push(id);
    if (id === "case-1") return { ok: true, status: 204, json: async () => null };
    if (id === "case-2") return { ok: false, status: 403, json: async () => ({ error: "Managers only" }) };
    return { ok: false, status: 409, json: async () => ({ error: "Record is locked" }) };
  });
  const { failedIds } = reconcileDeletionResults(firstAttempt);
  await deleteWorkspaceInvestigations(failedIds, async (id) => {
    submitted.push(id);
    return { ok: true, status: 204, json: async () => null };
  });

  assert.deepEqual(submitted, ["case-1", "case-2", "case-3", "case-3"]);
});

test("a fully successful bulk deletion allows the workspace to refresh", () => {
  const outcome = reconcileDeletionResults([
    { id: "case-1", ok: true, error: null, status: 204, retryable: false },
  ]);
  assert.deepEqual(outcome.failedIds, []);
  assert.equal(outcome.shouldRefresh, true);
});

test("bulk deletion preserves authentication, permission, and record-specific API errors", async () => {
  const responses = new Map([
    ["case-1", { status: 401, error: "Your session has expired" }],
    ["case-2", { status: 403, error: "Managers only" }],
    ["case-3", { status: 409, error: "Investigation has an active export" }],
  ]);
  const results = await deleteWorkspaceInvestigations([...responses.keys()], async (id) => {
    const response = responses.get(id);
    return { ok: false, status: response.status, json: async () => ({ error: response.error }) };
  });

  assert.deepEqual(results.map(({ id, error, retryable }) => ({ id, error, retryable })), [
    { id: "case-1", error: "Your session has expired", retryable: false },
    { id: "case-2", error: "Managers only", retryable: false },
    { id: "case-3", error: "Investigation has an active export", retryable: true },
  ]);
  const outcome = reconcileDeletionResults(results);
  assert.match(outcome.error, /case-1: Your session has expired/);
  assert.match(outcome.error, /case-2: Managers only/);
  assert.match(outcome.error, /case-3: Investigation has an active export/);
  assert.deepEqual(outcome.failedIds, ["case-3"]);
  assert.equal(outcome.canRetry, true);
});

test("authentication and permission failures are removed from retained retry selection", async () => {
  const results = await deleteWorkspaceInvestigations(["case-1", "case-2"], async (id) => ({
    ok: false,
    status: id === "case-1" ? 401 : 403,
    json: async () => ({ error: id === "case-1" ? "Your session has expired" : "Managers only" }),
  }));
  const outcome = reconcileDeletionResults(results);

  assert.deepEqual(outcome.failedIds, []);
  assert.equal(outcome.canRetry, false);
  assert.match(outcome.error, /Your session has expired/);
  assert.match(outcome.error, /Managers only/);

  const retainedSelection = new Set(outcome.failedIds);
  const selectionAfterClosingAndReopening = intersectVisibleSelection(retainedSelection, new Set(["case-1", "case-2"]));
  assert.deepEqual(selectionAfterClosingAndReopening, []);
});

test("a missing investigation is terminal and reconciled as already removed", async () => {
  const results = await deleteWorkspaceInvestigations(["case-1"], async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: "Investigation not found" }),
  }));
  const outcome = reconcileDeletionResults(results);

  assert.equal(results[0].retryable, false);
  assert.deepEqual(outcome.removedIds, ["case-1"]);
  assert.deepEqual(outcome.failedIds, []);
  assert.equal(outcome.error, null);
  assert.equal(outcome.canRetry, false);
  assert.equal(outcome.shouldRefresh, true);
});

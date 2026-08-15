import test from "node:test";
import assert from "node:assert/strict";
import { CaseAccessError, CaseNotFoundError, CaseService } from "../lib/workspace/cases.ts";
import { CaseRepository } from "../lib/workspace/caseRepository.ts";
import { readFile } from "node:fs/promises";

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

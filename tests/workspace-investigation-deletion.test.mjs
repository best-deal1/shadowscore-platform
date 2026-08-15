import test from "node:test";
import assert from "node:assert/strict";
import { CaseAccessError, CaseNotFoundError, CaseService } from "../lib/workspace/cases.ts";
import { CaseRepository } from "../lib/workspace/caseRepository.ts";

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

test("successful owned deletion returns a representation and true", async () => {
  let request;
  const repository = new CaseRepository(async (path, init) => { request = { path, init }; return [{ id: "internal" }]; }, "token");
  assert.equal(await repository.delete(actor(), "case-1"), true);
  assert.match(request.path, /public_id=eq\.case-1/);
  assert.match(request.path, /organization_id=eq\.org-1/);
  assert.match(request.path, /select=id/);
  assert.equal(request.init.headers.Prefer, "return=representation");
});

test("zero-row deletion returns failure", async () => {
  const repository = new CaseRepository(async () => [], "token");
  assert.equal(await repository.delete(actor(), "missing"), false);
});

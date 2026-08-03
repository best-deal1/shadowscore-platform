import test from "node:test";
import assert from "node:assert/strict";
import { CaseAccessError, CaseNotFoundError, CaseService } from "../lib/workspace/cases.ts";

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

test("workspace members can delete an investigation", async () => {
  const store = new Store();
  await new CaseService(store).delete(actor(), "case-1");
  assert.equal(store.deleted, true);
});

test("viewers cannot delete investigations", async () => {
  await assert.rejects(() => new CaseService(new Store()).delete(actor("viewer"), "case-1"), CaseAccessError);
});

test("missing investigations return a not-found error", async () => {
  const store = new Store();
  store.delete = async () => false;
  await assert.rejects(() => new CaseService(store).delete(actor(), "missing"), CaseNotFoundError);
});

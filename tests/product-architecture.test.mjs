import assert from "node:assert/strict";
import test from "node:test";
import { claimGuestReport, checkEntitlement, issueGuestReport, listProducts } from "../lib/products/index.ts";

test("catalog separates one-time reports from workspace monitoring without prices", () => {
  const products = listProducts();
  assert.deepEqual(products.map((product) => product.productId), [
    "instant_report", "starter_monitoring", "professional_monitoring", "business_monitoring",
  ]);
  assert.equal(products[0].billingModel, "one_time");
  assert.ok(products.slice(1).every((product) => product.billingModel === "recurring"));
  assert.ok(products.every((product) => !("price" in product)));
});

test("entitlements are scoped and enforce product limits", () => {
  const context = { now: new Date("2026-07-26T12:00:00Z"), grants: [{
    productId: "starter_monitoring", scope: "workspace", scopeId: "workspace-1", status: "active", startsAt: "2026-07-01T00:00:00Z",
  }] };
  assert.deepEqual(checkEntitlement(context, { feature: "watchlist.manage", scope: "workspace", scopeId: "workspace-1", currentUsage: 2, limit: "monitoredAssets" }), { allowed: true, reason: "granted" });
  assert.deepEqual(checkEntitlement(context, { feature: "watchlist.manage", scope: "workspace", scopeId: "workspace-1", currentUsage: 3, limit: "monitoredAssets" }), { allowed: false, reason: "limit_reached" });
  assert.deepEqual(checkEntitlement(context, { feature: "api.access", scope: "workspace", scopeId: "workspace-1" }), { allowed: false, reason: "missing_entitlement" });
  assert.deepEqual(checkEntitlement(context, { feature: "watchlist.manage", scope: "report", scopeId: "workspace-1" }), { allowed: false, reason: "missing_entitlement" });
});

test("a guest report can be claimed once and produces a report-scoped grant", async () => {
  const records = [];
  const repository = {
    async save(record) { records.push(record); },
    async findByClaimTokenHash(hash) { return records.find((record) => record.claimTokenHash === hash) ?? null; },
    async update(record) { records.splice(records.findIndex((item) => item.id === record.id), 1, record); },
  };
  const receipt = await issueGuestReport(repository, { email: " Buyer@Example.com ", reportId: "report-1", now: new Date("2026-07-01T00:00:00Z") });
  assert.equal(records[0].email, "buyer@example.com");
  assert.notEqual(records[0].claimTokenHash, receipt.claimToken);
  assert.notEqual(records[0].downloadTokenHash, receipt.downloadToken);
  const claim = await claimGuestReport(repository, { claimToken: receipt.claimToken, userId: "user-1", now: new Date("2026-07-02T00:00:00Z") });
  assert.equal(claim.reportId, "report-1");
  assert.deepEqual(claim.grant, { productId: "instant_report", scope: "report", scopeId: "report-1", status: "active", startsAt: "2026-07-02T00:00:00.000Z" });
  await assert.rejects(() => claimGuestReport(repository, { claimToken: receipt.claimToken, userId: "user-2", now: new Date("2026-07-02T00:00:00Z") }), /already been claimed/);
});

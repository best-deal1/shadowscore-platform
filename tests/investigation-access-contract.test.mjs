import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canReadCustomerInvestigation,
  canReadStaffReport,
} from "../lib/investigationAccessContract.ts";

const owner = { userId: "customer-a", activeOrganizationIds: [], profileRole: "user" };
const member = { userId: "customer-b", activeOrganizationIds: ["organization-a"], profileRole: "user" };
const outsider = { userId: "customer-c", activeOrganizationIds: ["organization-b"], profileRole: "user" };
const scope = { ownerUserId: "customer-a", organizationId: "organization-a" };

test("the owning customer can read an Investigation", () => {
  assert.equal(canReadCustomerInvestigation(owner, scope), true);
});

test("an active organization member can read an Investigation", () => {
  assert.equal(canReadCustomerInvestigation(member, scope), true);
});

test("a cross-tenant customer cannot read an Investigation", () => {
  assert.equal(canReadCustomerInvestigation(outsider, scope), false);
});

test("only the approved database staff role can read reports as staff", () => {
  assert.equal(canReadStaffReport({ ...outsider, profileRole: "admin" }), true);
  assert.equal(canReadStaffReport(outsider), false);
  assert.equal(canReadStaffReport({ ...outsider, profileRole: "support" }), false);
});

test("the migration applies matching RLS rules and canonical projections", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260801010000_sprint_1_investigation_contract.sql", import.meta.url), "utf8");
  assert.match(sql, /auth\.uid\(\) = i\.user_id/);
  assert.match(sql, /m\.status = 'active'/);
  assert.match(sql, /p\.role = 'admin'/);
  assert.match(sql, /create or replace view public\.investigation_list_projection/);
  assert.match(sql, /create or replace view public\.investigation_detail_projection/);
  assert.match(sql, /create or replace view public\.investigation_report_projection/);
  assert.match(sql, /security_invoker = true/);
});

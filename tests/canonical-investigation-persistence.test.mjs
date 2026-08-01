import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SupabaseInvestigationRepository } from "../lib/investigation/workflowRepository.ts";

function persistentSupabase() {
  const rows = [];
  const reports = [];
  const tenants = new Map([
    ["owner-token", { userId: "owner", organizations: ["org-a"] }],
    ["member-token", { userId: "member", organizations: ["org-a"] }],
    ["disabled-token", { userId: "disabled", organizations: [] }],
    ["other-token", { userId: "other", organizations: ["org-b"] }],
  ]);

  async function request(path, init = {}, token) {
    const tenant = tenants.get(token);
    assert.ok(tenant, "an authenticated JWT is required");
    const visible = (row) => row.user_id === tenant.userId || tenant.organizations.includes(row.organization_id);

    if (path.startsWith("/rest/v1/intakes")) {
      const input = JSON.parse(init.body);
      assert.equal(input.user_id, tenant.userId);
      assert.ok(input.organization_id === null || tenant.organizations.includes(input.organization_id));
      const now = new Date().toISOString();
      const row = { ...input, created_at: now, updated_at: now };
      rows.push(row);
      return [row];
    }
    if (path.includes("investigation_report_projection")) {
      const id = path.match(/investigation_id=eq\.([^&]+)/)?.[1];
      return reports.filter((report) => (!id || report.investigation_id === decodeURIComponent(id)) && rows.some((row) => row.intake_id === report.investigation_id && visible(row)));
    }
    const id = path.match(/investigation_id=eq\.([^&]+)/)?.[1];
    return rows.filter((row) => visible(row) && (!id || row.intake_id === decodeURIComponent(id))).map((row) => ({
      investigation_id: row.intake_id,
      owner_user_id: row.user_id,
      organization_id: row.organization_id,
      target: row.target,
      platform: row.platform,
      scan_mode: row.scan_mode,
      case_type: row.case_type,
      payment_status: row.payment_status,
      report_status: row.report_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }
  return { request, reports };
}

test("canonical investigation persists and is tenant scoped", async () => {
  const database = persistentSupabase();
  const owner = new SupabaseInvestigationRepository(database.request, "owner-token", { userId: "owner", organizationId: "org-a", email: "owner@example.com" });
  const created = await owner.create({ target: "example.com", targetType: "Website" });
  assert.equal(created.investigationId, created.intakeId);
  database.reports.push({ investigation_id: created.investigationId, report_id: "report-1", report_status: "ready" });

  assert.equal((await owner.list())[0].investigationId, created.investigationId);
  assert.equal((await owner.get(created.investigationId))?.reportId, "report-1");

  const restarted = new SupabaseInvestigationRepository(database.request, "owner-token", { userId: "owner", organizationId: "org-a", email: "owner@example.com" });
  assert.equal((await restarted.get(created.investigationId))?.investigationId, created.investigationId);

  const activeMember = new SupabaseInvestigationRepository(database.request, "member-token", { userId: "member", organizationId: "org-a", email: "member@example.com" });
  assert.equal((await activeMember.get(created.investigationId))?.investigationId, created.investigationId);

  for (const [token, userId] of [["disabled-token", "disabled"], ["other-token", "other"]]) {
    const unrelated = new SupabaseInvestigationRepository(database.request, token, { userId, organizationId: token === "other-token" ? "org-b" : null, email: `${userId}@example.com` });
    assert.deepEqual(await unrelated.list(), []);
    assert.equal(await unrelated.get(created.investigationId), null);
  }
});

test("production Investigation paths contain no seeded customer fallback", async () => {
  const files = [
    "lib/investigation/workflowRepository.ts",
    "lib/investigation/workflowService.ts",
    "app/investigations/page.tsx",
    "app/investigations/[investigationId]/page.tsx",
    "app/api/investigations/route.ts",
  ];
  const source = (await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")))).join("\n");
  for (const forbidden of ["seededInvestigations", "__shadowScoreInvestigations", "maya-chen", "identity-record", "domain-record"]) assert.equal(source.includes(forbidden), false);
});

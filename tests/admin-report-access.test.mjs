import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("administrator report access is authorized from the server-side profile role", async () => {
  const [service, route, migration] = await Promise.all([read("lib/adminReportAccess.ts"), read("app/api/admin/report-access/route.ts"), read("supabase/migrations/20260801000000_secure_admin_report_access.sql")]);
  assert.match(service, /profiles\?id=eq\./);
  assert.match(service, /rows\[0\]\?\.role === "admin"/);
  assert.match(service, /AdminReportAccessError\("Administrator access is required\.", 403\)/);
  assert.match(route, /error instanceof AdminReportAccessError/);
  assert.match(route, /status: error\.status/);
  assert.match(migration, /prevent_self_role_change/);
  assert.doesNotMatch(service, /NEXT_PUBLIC_ADMIN_EMAILS|nir@012\.net\.il/);
});

test("administrator generation stores a non-paid report with shared report access", async () => {
  const [service, access] = await Promise.all([read("lib/adminReportAccess.ts"), read("lib/reportAccess.ts")]);
  assert.match(service, /buildReadyReport/);
  assert.match(service, /payment_status: "admin_comped"/);
  assert.match(service, /access_type: "administrator"/);
  assert.match(service, /report_status: "ready"/);
  assert.match(access, /report\.paymentStatus === "admin_comped"/);
});

test("administrator report generation does not mutate website monitoring state", async () => {
  const service = await read("lib/adminReportAccess.ts");
  assert.match(service, /const report = await buildReadyReport\(\{[\s\S]*?reportId,[\s\S]*?createdAt: now,[\s\S]*?\}\);/);
  assert.doesNotMatch(service, /SupabaseWebsite(?:ScanHistory|Alert|Watchlist)Repository/);
  assert.doesNotMatch(service, /website(?:History|Alert|Watchlist)Repository:/);
  assert.doesNotMatch(service, /websiteTenantId:/);
});

test("administrator reports carry a complete audit record and customer notice", async () => {
  const [service, migration, report] = await Promise.all([read("lib/adminReportAccess.ts"), read("supabase/migrations/20260801000000_secure_admin_report_access.sql"), read("components/report/ExecutiveIntelligenceReport.tsx")]);
  assert.match(service, /administrator_user_id: session\.userId/);
  assert.match(service, /investigation_id: intake\.intakeId/);
  assert.match(service, /report_id: reportId/);
  assert.match(service, /reason/);
  assert.match(migration, /created_at timestamptz not null default now\(\)/);
  assert.match(report, /Administrator test report - no customer payment was processed\./);
});

test("ordinary payment completion remains paid and cannot grant administrator access", async () => {
  const [paymentService, paypalCallback, internalCallback] = await Promise.all([read("lib/workspace.server.ts"), read("app/api/payments/paypal/complete/route.ts"), read("app/api/workspace/mark-paid/route.ts")]);
  assert.match(paymentService, /payment_status: "paid"/);
  assert.match(paypalCallback, /payment_status/);
  assert.doesNotMatch(`${paypalCallback}\n${internalCallback}`, /admin_comped|access_type|profiles\.role/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Beta Candidate UAT keeps the complete customer journey connected", async () => {
  const [home, intake, payment, report, workspace, archive, account, login] = await Promise.all([
    read("app/HomeClient.tsx"), read("app/intake/page.tsx"), read("app/reports/[reportId]/ReportFlow.tsx"),
    read("components/report/ExecutiveIntelligenceReport.tsx"), read("components/workspace/InvestigationWorkspace.tsx"),
    read("app/archive/ArchiveWorkspace.tsx"), read("app/account/page.tsx"), read("app/login/page.tsx"),
  ]);
  assert.match(home, /router\.push\("\/intake"\)/);
  assert.match(intake, /Confirm the Business and scope before payment/);
  assert.match(payment, /Payment confirmed/);
  assert.match(report, /executive-report/);
  assert.match(workspace, /Archive/);
  assert.match(archive, /Restore/);
  assert.match(archive, /Delete/);
  assert.match(account, /signOut/);
  assert.match(login, /returnTo/);
});

test("archive, restore, and delete use authenticated lifecycle endpoints", async () => {
  const [endpoint, service, archive] = await Promise.all([
    read("app/api/workspace/investigations/[caseId]/route.ts"), read("lib/workspace/cases.ts"), read("app/archive/ArchiveWorkspace.tsx"),
  ]);
  assert.match(endpoint, /export async function PATCH/);
  assert.match(endpoint, /export async function DELETE/);
  assert.match(service, /archived: \["closed"\]/);
  assert.match(archive, /status: "closed"/);
  assert.match(archive, /window\.confirm/);
});

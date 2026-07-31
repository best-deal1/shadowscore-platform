import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("beta purchase journey has one canonical start and safe legacy redirects", async () => {
  const [layout, config, login, home] = await Promise.all([read("components/ShadowScoreLayout.tsx"), read("next.config.ts"), read("app/login/page.tsx"), read("app/HomeClient.tsx")]);
  assert.match(layout, /href="\/intake"/);
  assert.match(config, /source: "\/dashboard", destination: "\/investigations"/);
  assert.match(config, /source: "\/workspace", destination: "\/investigations"/);
  assert.match(config, /source: "\/reports", destination: "\/archive"/);
  assert.match(login, /\|\| "\/investigations"/);
  assert.match(home, /One Business Investigation produces one Executive Report for a one-time price of \$9\.90/);
});

test("intake confirms Business, scope, deliverable, and price before payment", async () => {
  const intake = await read("app/intake/page.tsx");
  for (const copy of ["Confirm the Business and scope before payment", "Investigation scope", "Optional customer Evidence", "Executive Report", "$9.90", "Customer email (required)"]) assert.ok(intake.includes(copy), copy);
  assert.match(intake, /CHECKOUT_DRAFT_KEY/);
});

test("payment and Investigation statuses remain separate", async () => {
  const flow = await read("app/reports/[reportId]/ReportFlow.tsx");
  assert.match(flow, /Payment confirmed/);
  assert.match(flow, /Investigation status/);
  assert.match(flow, /You can safely close this page/);
  assert.match(flow, /Check its status from Investigations or the Archive/);
});

test("Archive and report provide retrieval, print identity, and repeat purchase", async () => {
  const [archive, report] = await Promise.all([read("app/archive/ArchiveClient.tsx"), read("components/report/ExecutiveIntelligenceReport.tsx")]);
  assert.match(archive, /View Executive Report/);
  assert.match(archive, /Start Investigation/);
  assert.match(report, /window\.print/);
  assert.match(report, /Investigation \{report\.intakeId \|\| report\.reportId\}/);
  assert.match(report, /Version 1\.0/);
  assert.match(report, /requires the recipient to sign in/);
});

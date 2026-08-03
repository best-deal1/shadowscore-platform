import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("premium investigation journey exposes every progress stage", async () => {
  const progress = await readFile(new URL("../components/investigation/JourneyProgress.tsx", import.meta.url), "utf8");
  for (const stage of ["Investigation", "Review and payment", "Processing", "Executive Report"]) assert.match(progress, new RegExp(stage));
  assert.match(progress, /aria-current=\{active \? "step"/);
});

test("executive report supports risk, sharing, and PDF export", async () => {
  const report = await readFile(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const capability of ["Overall risk", "Copy secure link", "Share report", "Export PDF"]) assert.match(report, new RegExp(capability));
  assert.match(report, /role="status"/);
  assert.match(report, /aria-label=\{`Overall risk score/);
});

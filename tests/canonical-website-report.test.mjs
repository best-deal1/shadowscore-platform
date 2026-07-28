import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("the sample keeps the canonical website renderer and the paid route uses the executive report", () => {
  const paid = readFileSync(resolve(root, "app/report/page.tsx"), "utf8");
  const sample = readFileSync(resolve(root, "app/sample-report/page.tsx"), "utf8");
  assert.match(paid, /ExecutiveIntelligenceReport/);
  assert.match(sample, /WebsiteIntelligenceReportView/);
  assert.match(sample, /sampleWebsiteIntelligenceReport/);
});

test("the report pipeline creates the canonical report from acquisition output", () => {
  const pipeline = readFileSync(resolve(root, "lib/reportPipeline.ts"), "utf8");
  assert.match(pipeline, /toCanonicalWebsiteReport\(websiteIntelligence\)/);
  assert.match(pipeline, /canonicalWebsiteReport,/);
});

test("canonical findings preserve evidence references", () => {
  const adapter = readFileSync(resolve(root, "lib/websiteIntelligence/canonicalReport.ts"), "utf8");
  assert.match(adapter, /evidenceIds:/);
  assert.match(adapter, /filter\(\(id\) => evidenceIds\.has\(id\)\)/);
  assert.match(adapter, /completedModules \/ totalModules/);
});

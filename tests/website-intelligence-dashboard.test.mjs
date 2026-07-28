import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { getWebsiteIntelligenceDashboardMetrics } from "../lib/websiteIntelligence/dashboard.ts";
import { sampleWebsiteIntelligenceReport } from "../lib/websiteIntelligence/sampleReport.ts";

const root = resolve(import.meta.dirname, "..");

test("severity counts and coverage are derived from the sample fixture", () => {
  const metrics = getWebsiteIntelligenceDashboardMetrics(sampleWebsiteIntelligenceReport);
  assert.deepEqual(metrics.severityCounts, { high: 0, medium: 0, low: 1, info: 1 });
  assert.equal(sampleWebsiteIntelligenceReport.coverage.percent, 67);
  assert.equal(sampleWebsiteIntelligenceReport.coverage.completedModules, 2);
  assert.equal(sampleWebsiteIntelligenceReport.coverage.totalModules, 3);
});

test("partial and unavailable reports have evidence-aware indicators", () => {
  assert.equal(getWebsiteIntelligenceDashboardMetrics(sampleWebsiteIntelligenceReport).statusLabel, "Partial evidence");
  const unavailable = { ...sampleWebsiteIntelligenceReport, status: "unavailable", limitations: [] };
  const metrics = getWebsiteIntelligenceDashboardMetrics(unavailable);
  assert.equal(metrics.statusLabel, "Evidence unavailable");
  assert.equal(metrics.hasLimitedEvidence, true);
});

test("the dashboard renders from the sample fixture above the detailed report", () => {
  const component = readFileSync(resolve(root, "app/components/WebsiteIntelligenceDashboard.tsx"), "utf8");
  const samplePage = readFileSync(resolve(root, "app/sample-report/page.tsx"), "utf8");
  const paidPage = readFileSync(resolve(root, "app/report/page.tsx"), "utf8");
  for (const label of ["Evidence coverage", "Assessment summary", "Top recommended actions", "Module status overview", "Evidence limitations"]) assert.match(component, new RegExp(label));
  assert.match(samplePage, /WebsiteIntelligenceDashboard report=\{sampleWebsiteIntelligenceReport\}/);
  assert.ok(samplePage.indexOf("WebsiteIntelligenceDashboard") < samplePage.indexOf("WebsiteIntelligenceReportView report="));
  assert.match(paidPage, /ExecutiveIntelligenceReport report=\{report\}/);
});

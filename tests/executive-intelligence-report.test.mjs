import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupExecutiveEvidence, executiveRecommendation, recommendedActions } from "../lib/executiveReport.ts";

const report = (overrides = {}) => ({
  reportId: "report-6", title: "Report", entity: "Acme Ltd", platform: "web", scanMode: "website", stage: "Healthy",
  createdAt: "2026-07-28T10:00:00Z", reportStatus: "ready", source: "test", topFactors: [],
  reportSummary: { message: "Evidence supports a cautious review.", businessIntelligence: { findings: [{ id: "f1", category: "credibility_support", direction: "supports_credibility", title: "Identity aligned", statement: "The identity records align.", affectedFields: [], evidence: [
    { id: "e1", providerId: "registry", label: "Legal name", value: "Acme Ltd", source: "Registry", observedAt: "2026-07-28T09:00:00Z", field: "legal_name" },
    { id: "e2", providerId: "registry-copy", label: "Legal name", value: "Acme Ltd", source: "Registry", observedAt: "2026-07-28T09:01:00Z", field: "legal_name" },
  ] }], evidenceCount: 2, providersCorrelated: ["registry"], engineVersion: "1", generatedAt: "2026-07-28T10:00:00Z" } },
  ...overrides,
});

test("executive report renders every required section and footer field", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const section of ["Executive Summary", "Executive Recommendation", "Risk Score Card", "Key Findings", "Evidence Summary", "Investigation Timeline", "Recommended Actions", "Source Appendix", "Report ID", "Engine version"]) assert.match(component, new RegExp(section));
});

test("executive report provides a printable PDF document with a cover, sources, and technical appendix", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /onClick=\{printReport\}/);
  assert.match(component, /Investigation date/);
  assert.match(component, /Report type/);
  assert.match(component, /Evidence Quality/);
  assert.match(component, /Business Meaning/);
  assert.match(component, /Document control/);
  assert.match(styles, /@page\{size:A4/);
  assert.match(styles, /@media print/);
  assert.match(styles, /break-after:page/);
});

test("executive summary and recommendation always have fallbacks", () => {
  assert.deepEqual(executiveRecommendation(report({ reportSummary: undefined })), { label: "Proceed with caution", explanation: "Review the available evidence and resolve material gaps before making a commitment." });
  assert.equal(recommendedActions(report({ reportSummary: undefined })).length, 3);
});

test("evidence is grouped by business category and deduplicated", () => {
  const groups = groupExecutiveEvidence(report());
  assert.equal(groups.length, 1);
  assert.equal(groups[0].category, "Business Registration");
  assert.equal(groups[0].items.length, 1);
});

test("missing provider data is handled without synthetic sources", () => {
  assert.deepEqual(groupExecutiveEvidence(report({ reportSummary: { message: "Ready" } })), []);
});

test("both ready-report routes use the executive report presentation", () => {
  for (const path of ["../app/report/page.tsx", "../app/reports/[reportId]/ReportFlow.tsx"]) assert.match(readFileSync(new URL(path, import.meta.url), "utf8"), /ExecutiveIntelligenceReport report=\{report\}/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { executiveBusinessImpacts, executiveDecisionReasons, executiveFindingStories, groupExecutiveEvidence, executiveRecommendation, materialEvidenceGaps, recommendedActions } from "../lib/executiveReport.ts";

const report = (overrides = {}) => ({
  reportId: "report-6", title: "Report", entity: "Acme Ltd", platform: "web", scanMode: "website", stage: "Healthy",
  createdAt: "2026-07-28T10:00:00Z", reportStatus: "ready", source: "test", topFactors: [],
  reportSummary: { message: "Evidence supports a cautious review.", businessIntelligence: { findings: [{ id: "f1", category: "credibility_support", direction: "supports_credibility", title: "Identity aligned", statement: "The identity records align.", affectedFields: [], evidence: [
    { id: "e1", providerId: "registry", label: "Legal name", value: "Acme Ltd", source: "Registry", observedAt: "2026-07-28T09:00:00Z", field: "legal_name" },
    { id: "e2", providerId: "registry-copy", label: "Legal name", value: "Acme Ltd", source: "Registry", observedAt: "2026-07-28T09:01:00Z", field: "legal_name" },
  ] }], evidenceCount: 2, providersCorrelated: ["registry"], engineVersion: "1", generatedAt: "2026-07-28T10:00:00Z" } },
  ...overrides,
});

test("executive report renders the decision brief and report sections", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const section of ["Executive Decision Brief", "Decision", "Why", "Business Impact", "Immediate Actions", "Missing Evidence", "Investigation Timeline", "Executive Recommendation", "Source Appendix", "Report ID", "Engine version"]) assert.match(component, new RegExp(section));
});

test("case file cover precedes the unchanged executive decision brief", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const field of ["Case Reference", "Investigation Date", "Business Under Review", "Investigation Type", "Investigation Status", "Evidence Sources Reviewed", "Evidence Items Collected", "Confidence", "Decision", "Case Objective", "Investigation Scope", "Investigation Methodology"]) assert.match(component, new RegExp(field));
  assert.ok(component.indexOf('id="case-summary"') < component.indexOf('id="decision-brief"'));
  assert.doesNotMatch(component, /\bAI\b|artificial intelligence/i);
});

test("decision brief uses evidence-backed reasons and exactly three actions", () => {
  assert.deepEqual(executiveDecisionReasons(report()), [{ id: "f1", statement: "The identity records align.", evidence: "Registry" }]);
  assert.equal(recommendedActions(report()).length, 3);
});

test("important findings explain the observation, consequence, evidence, and next step", () => {
  assert.deepEqual(executiveFindingStories(report()), [{
    id: "f1",
    title: "Identity aligned",
    direction: "supports_credibility",
    observation: "The identity records align.",
    whyItMatters: "It helps confirm that the business receiving the commitment is the business that was reviewed.",
    commercialRisk: "The risk of contracting with or paying the wrong legal entity is reduced.",
    evidence: "Registry",
    nextStep: "Match the final contract, invoice, and payment account to the verified business name before sending funds.",
  }]);
  assert.match(executiveRecommendation(report()).explanation, /key finding.*identity records align.*supported by Registry.*risk of contracting.*Required response/s);
});

test("report presents each part of the finding story in plain business language", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const label of ["Observed:", "Why it matters:", "Commercial risk:", "Evidence:", "Next step:"]) assert.match(component, new RegExp(label));
});

test("decision brief uses material intelligence impacts and gaps", () => {
  const intelligence = { risks: [{ businessImpact: "Payment could reach an unrelated entity." }], contradictions: [], evidenceGaps: [{ id: "g1", missingEvidence: "VAT certificate", recommendation: "Request it.", confidenceImpact: "Would confirm registration." }] };
  const brief = report({ reportSummary: { ...report().reportSummary, investigationIntelligence: intelligence } });
  assert.deepEqual(executiveBusinessImpacts(brief), ["Payment could reach an unrelated entity."]);
  assert.deepEqual(materialEvidenceGaps(brief), intelligence.evidenceGaps);
});

test("executive summary and recommendation always have fallbacks", () => {
  assert.deepEqual(executiveRecommendation(report({ reportSummary: undefined })), { label: "Proceed with Conditions", explanation: "Review the available evidence and resolve material gaps before making a commitment." });
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

test("personal email actions focus on identity while corporate email actions retain domain controls", () => {
  const summary = {
    ...report().reportSummary,
    investigationType: "EMAIL",
    investigationIntelligence: { risks: [], contradictions: [], evidenceGaps: [{ id: "dns", missingEvidence: "DNS", recommendation: "Review DNS and TLS controls.", confidenceImpact: "Domain posture remains unresolved." }] },
  };
  const personal = recommendedActions(report({ entity: "person@gmail.com", reportSummary: summary }));
  const corporate = recommendedActions(report({ entity: "owner@example.com", reportSummary: summary }));
  assert.equal(personal.some((action) => /dns|tls/i.test(action)), false);
  assert.equal(corporate.some((action) => /dns|tls/i.test(action)), true);
});

test("saved identity candidates use backward-compatible rendering fallbacks", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  assert.match(component, /candidate\.discoveryPath \|\| \[candidate\.profileUrl\]/);
  assert.match(component, /candidate\.supportingEvidence\?\.length \|\| 0/);
});

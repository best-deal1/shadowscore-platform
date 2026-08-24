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
  for (const field of ["Case Reference", "Investigation Date", "Business Under Review", "Investigation Type", "Investigation Status", "Evidence Sources Reviewed", "Search results reviewed", "Potential identity matches", "Independently corroborated records", "Verified subject facts", "Confidence", "Decision", "Case Objective", "Investigation Scope", "Investigation Methodology"]) assert.match(component, new RegExp(field));
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

test("confirmed adverse decisions survive an unavailable narrative confidence", () => {
  const intelligence = {
    decisionSupport: { outcome: "Do Not Proceed", justification: "A critical conflict was confirmed.", conditions: [] },
    executiveInsight: "Verified evidence contains a critical identity conflict.",
    evidenceLifecycle: { counts: { observations: 0, discoveryCandidates: 0, corroboratedEvidence: 0, verifiedFacts: 0 }, adverseFindings: ["adverse-1"] },
    executiveClaims: [], risks: [], contradictions: [], evidenceGaps: [],
  };
  const adverse = report({ reportSummary: { ...report().reportSummary, businessNarrative: { confidence: "None", sections: [] }, investigationIntelligence: intelligence } });
  assert.equal(executiveRecommendation(adverse).label, "Do Not Proceed");
});

test("decision reasons cite readable source names instead of internal evidence IDs", () => {
  const intelligence = { executiveClaims: [{ id: "claim:f1", statement: "The identity records align.", status: "supported", evidenceIds: ["e1"] }] };
  const reasons = executiveDecisionReasons(report({ reportSummary: { ...report().reportSummary, investigationIntelligence: intelligence } }));
  assert.equal(reasons[0].evidence, "Registry");
  assert.doesNotMatch(reasons[0].evidence, /\be1\b/);
});

test("report uses customer-facing evidence lifecycle labels", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  for (const label of ["Search results reviewed", "Potential identity matches", "Independently corroborated records", "Verified subject facts", "Sources reviewed", "Material conflicts", "Relevant relationships", "Review time"]) assert.match(component, new RegExp(label));
  for (const internalLabel of ["Search Observations", "Discovery Candidates", "Providers executed", "Contradictions found", "Generation time"]) assert.doesNotMatch(component, new RegExp(internalLabel));
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
  assert.match(component, /candidate\.identityAttributionConfidence === null \? "Unverified"/);
  assert.match(component, /candidate\.identityAttributionConfidence \?\? candidate\.confidence/);
  assert.match(component, /candidate\.candidateDiscoveryConfidence/);
  assert.doesNotMatch(component, />Confidence<\/dt><dd className="mt-1">\{candidate\.confidence\}%/);
  assert.match(component, /\.map\(normalizeIdentityCandidate\)/);
  assert.match(component, /candidate\.matchedIdentifiers \|\| \[\]/);
  assert.match(component, /typeof candidate\.candidateDiscoveryConfidence === "number"/);
  assert.match(component, /resolutionRank: candidate\.resolutionRank \|\| index \+ 1/);
  assert.match(component, /Rank \{candidate\.resolutionRank\}/);
});

test("discovery diagnostics are restricted to administrator reports", () => {
  const component = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  assert.match(component, /report\.accessType === "administrator" && discoveryDiagnostics/);
  assert.match(component, /Discovery Diagnostics/);
  assert.match(component, /entry\.newIdentifiers/);
});

test("personal identity production output is presented with resolver evidence and identity checkout copy", () => {
  const report = readFileSync(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  const checkout = readFileSync(new URL("../app/reports/[reportId]/ReportFlow.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/checkout/intent/route.ts", import.meta.url), "utf8");
  for (const label of ["Discovery relevance", "Resolver-backed identity evidence", "Matched signals", "Conflicting signals", "Source provenance"]) assert.match(report, new RegExp(label));
  assert.match(report, /resolutionOutcome/);
  assert.match(report, /independentSourceFamilyCount/);
  assert.match(checkout, /Personal Identity Investigation/);
  assert.match(checkout, /Person or identifier/);
  assert.match(route, /Personal Identity Investigation/);
});

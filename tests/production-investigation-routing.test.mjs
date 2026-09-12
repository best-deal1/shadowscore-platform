import assert from "node:assert/strict";
import test from "node:test";

import { resolveInvestigationRouting, reportRendererForRouting } from "../lib/investigationRouting.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";
import { classifyTarget } from "../lib/targetClassifier/index.ts";
import { investigationCompletionStatus } from "../lib/reportCoverage.ts";
import { presentReportForEndUser } from "../lib/workspace.ts";
import { ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";
import { identityInvestigationGuardIssues, normalizeIntakeIdentitySignals } from "../lib/personalIdentity.ts";
import { readFile } from "node:fs/promises";

const plan = (target, scanMode, persisted) => {
  const routing = resolveInvestigationRouting({ target, scanMode, investigationRouting: persisted });
  return { routing, plan: createExecutionPlan(classifyTarget(target), routing), renderer: reportRendererForRouting(routing) };
};

for (const scanMode of ["personal", "website"]) test(`corporate email with legacy ${scanMode} scan mode remains business-first`, () => {
  const result = plan("sharon@shl.co.il", scanMode);
  assert.equal(result.routing.submittedSeed, "sharon@shl.co.il");
  assert.equal(result.routing.primaryInvestigationEntity, "shl.co.il");
  assert.equal(result.routing.primaryInvestigationType, "DOMAIN_BUSINESS_LEGAL_ENTITY");
  assert.equal(result.routing.emailClassification, "CORPORATE_DOMAIN");
  assert.equal(result.routing.localPartIdentityExpansionPermitted, false);
  assert.equal(result.plan.executionPlan.some(({ engineId }) => engineId === "external-identity"), false);
  assert.ok(result.plan.executionPlan.some(({ engineId }) => engineId === "authoritative-company"));
  assert.equal(result.renderer, "business");
});

for (const scanMode of ["personal", "website"]) test(`free-mail with ${scanMode} mode is normalized to the complete personal contract`, () => {
  const result = plan("person@gmail.com", scanMode);
  assert.equal(result.routing.primaryInvestigationEntity, "person@gmail.com");
  assert.equal(result.routing.primaryInvestigationType, "PERSON_IDENTITY");
  assert.deepEqual(result.plan.executionPlan.map(({ engineId }) => engineId), ["email-intelligence", "external-identity"]);
  assert.equal(result.renderer, "personal");
});

test("legacy email routing recovery is deterministic and canonical persisted routing wins", () => {
  assert.equal(plan("legacy@yahoo.com", "website").renderer, "personal");
  assert.equal(plan("legacy@company.test", "personal").renderer, "business");
  const persisted = resolveInvestigationRouting({ target: "owner@company.test", scanMode: "website" });
  assert.strictEqual(resolveInvestigationRouting({ target: "changed@gmail.com", scanMode: "personal", investigationRouting: persisted }), persisted);
});

test("corporate provider guard prevents a generic Sharon pivot and unrelated candidates", async () => {
  let requests = 0;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { requests += 1; return Response.json({ web: { results: [{ title: "Unrelated Sharon" }] } }); };
  try {
    const routing = resolveInvestigationRouting({ target: "sharon@shl.co.il", scanMode: "personal" });
    const result = await new ExternalIdentityProvider().execute({ intakeId: "production-matrix", scanMode: "personal", target: "shl.co.il", requestedTarget: routing.submittedSeed, email: routing.submittedSeed, platform: "admin", fileNames: [], visibleSignalCategories: [], investigationRouting: routing });
    assert.equal(requests, 0);
    assert.equal(result.metadata.lookupPerformed, false);
    assert.deepEqual(result.metadata.externalIdentityCandidates, []);
  } finally { globalThis.fetch = oldFetch; }
});

const provider = (executionCode, coverageState = "gap") => ({ providerId: "authoritative-company", providerVersion: "1", status: "skipped", startedAt: "", completedAt: "", duration: 0, findings: [], evidence: [], errors: [], metadata: { executionCode, coverageState, jurisdiction: null, providerSupportedJurisdictions: ["US federal public issuers"] } });
const evidenceItem = (type, category = "Verified", id = type, source = "test-source") => ({ id: `evidence-${id}`, source, provider: "external-identity", category, status: category === "Verified" ? "observed" : "not_checked", confidence: 85, title: "Production evidence", description: "Production evidence", businessImpact: "Review the evidence.", evidenceRefs: [{ id, type, label: type, source }] });

test("coverage outcomes remain distinct", () => {
  assert.equal(investigationCompletionStatus([provider("UNSUPPORTED_JURISDICTION")], []), "UNSUPPORTED_JURISDICTION");
  assert.equal(investigationCompletionStatus([provider("PROVIDER_UNAVAILABLE", "unavailable")], []), "PROVIDER_UNAVAILABLE");
  assert.equal(investigationCompletionStatus([provider("NO_AUTHORITATIVE_MATCH")], [evidenceItem("placeholder")]), "COMPLETED_WITH_UNRESOLVED_EVIDENCE");
  assert.equal(investigationCompletionStatus([], []), "NO_EVIDENCE_ABSTAIN");
});

test("provider execution failures override unrelated observations", () => {
  const infrastructureObservation = evidenceItem("document");
  assert.equal(investigationCompletionStatus([{ ...provider("PROVIDER_EXECUTION_TIMEOUT"), providerId: "external-identity" }], []), "COVERAGE_GAP");
  assert.equal(investigationCompletionStatus([provider("PROVIDER_EXECUTION_FAILURE")], [infrastructureObservation]), "COVERAGE_GAP");
});

test("failed provider HTTP outcomes override target echoes and other observations", () => {
  const targetEcho = evidenceItem("observation", "Verified", "profile-domain");
  const independentDocument = evidenceItem("document");
  for (const httpOutcome of ["blocked", "timeout", "network_failure", "tls_failure", "unsupported_content", "challenge_page", "parser_failure"]) {
    const failedBusinessProfile = { ...provider(undefined, "available"), providerId: "business-profile", status: "completed", metadata: { httpOutcome } };
    assert.equal(investigationCompletionStatus([failedBusinessProfile], [targetEcho, independentDocument]), "COVERAGE_GAP", httpOutcome);
  }
  const successfulBusinessProfile = { ...provider(undefined, "available"), providerId: "business-profile", status: "completed", metadata: { httpOutcome: "completed_with_evidence" } };
  assert.equal(investigationCompletionStatus([successfulBusinessProfile], [targetEcho]), "NO_EVIDENCE_ABSTAIN");
  assert.equal(investigationCompletionStatus([successfulBusinessProfile], [targetEcho, independentDocument]), "COMPLETED_WITH_EVIDENCE");
});

test("canonically personal website-mode free-mail is guarded at intake and execution", async () => {
  const routing = resolveInvestigationRouting({ target: "person@gmail.com", scanMode: "website" });
  const signals = normalizeIntakeIdentitySignals(undefined, { target: routing.submittedSeed, email: "buyer@example.com" });
  assert.equal(routing.primaryInvestigationType, "PERSON_IDENTITY");
  assert.deepEqual(signals.emails, ["person@gmail.com"]);
  assert.ok(identityInvestigationGuardIssues(true, signals, {}).length >= 5);
  assert.deepEqual(identityInvestigationGuardIssues(true, signals, {
    NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED: "true",
    PERSONAL_IDENTITY_ENABLED: "true",
    IDENTITY_MIGRATION_APPLIED: "true",
    IDENTITY_EVIDENCE_BUCKET_READY: "true",
    IDENTITY_STORAGE_POLICIES_VERIFIED: "true",
  }), []);

  const [intakeRoute, pipeline] = await Promise.all([
    readFile(new URL("../app/api/intakes/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/reportPipeline.ts", import.meta.url), "utf8"),
  ]);
  assert.match(intakeRoute, /resolveInvestigationRouting[\s\S]*primaryInvestigationType === "PERSON_IDENTITY"[\s\S]*identityInvestigationGuardIssues/);
  assert.match(intakeRoute, /identitySignals: personalIdentityInvestigation \? identitySignals : undefined/);
  assert.match(pipeline, /identityInvestigationGuardIssues\(personalIdentityInvestigation[\s\S]*personal_identity_execution_blocked[\s\S]*throw new Error/);
});

test("personal placeholder and unavailable observations are not successful evidence completion", () => {
  const placeholders = [evidenceItem("placeholder"), evidenceItem("provider", "Unavailable"), evidenceItem("search_result")];
  assert.equal(investigationCompletionStatus([], placeholders), "NO_EVIDENCE_ABSTAIN");
  assert.equal(investigationCompletionStatus([{ ...provider("PROVIDER_UNAVAILABLE", "unavailable"), providerId: "external-identity" }], placeholders), "PROVIDER_UNAVAILABLE");
  assert.equal(investigationCompletionStatus([], [...placeholders, evidenceItem("document")]), "COMPLETED_WITH_EVIDENCE");
});

test("paid report presentation preserves routing while removing internal provider data", () => {
  const routing = resolveInvestigationRouting({ target: "sharon@shl.co.il", scanMode: "personal" });
  const report = presentReportForEndUser({ reportId: "paid-1", title: "Report", entity: "shl.co.il", target: "shl.co.il", platform: "admin", scanMode: "personal", stage: "Warning", createdAt: new Date(0).toISOString(), reportStatus: "ready", source: "payment_unlock_pipeline", providerResults: [], reportSummary: { message: "Complete", investigationRouting: routing, investigationType: routing.primaryInvestigationType, completionStatus: "NO_EVIDENCE_ABSTAIN" }, topFactors: [] });
  assert.equal(report.providerResults, undefined);
  assert.deepEqual(report.reportSummary.investigationRouting, routing);
  assert.equal(reportRendererForRouting(report.reportSummary.investigationRouting), "business");
});

test("production-shaped paid personal reports preserve and render every canonical completion state", async () => {
  const presentation = await readFile(new URL("../components/report/PersonalIdentityReport.tsx", import.meta.url), "utf8");
  const routing = resolveInvestigationRouting({ target: "person@gmail.com", scanMode: "personal" });
  const expected = new Map([
    ["COMPLETED_WITH_EVIDENCE", "Completed with evidence"],
    ["COMPLETED_WITH_UNRESOLVED_EVIDENCE", "Unresolved, no match"],
    ["PROVIDER_UNAVAILABLE", "Provider unavailable"],
    ["COVERAGE_GAP", "Coverage gap"],
    ["UNSUPPORTED_JURISDICTION", "Unsupported coverage"],
    ["NO_EVIDENCE_ABSTAIN", "No evidence, result withheld"],
  ]);
  for (const [completionStatus, customerLabel] of expected) {
    const report = presentReportForEndUser({ reportId: `paid-${completionStatus}`, title: "Paid personal report", entity: "person@gmail.com", target: "person@gmail.com", platform: "Personal Identity", scanMode: "personal", stage: "Unknown", createdAt: new Date(0).toISOString(), reportStatus: "ready", source: "payment_unlock_pipeline", providerResults: [], reportSummary: { message: "Complete", investigationRouting: routing, investigationType: routing.primaryInvestigationType, completionStatus, discoveryDiagnostics: { searches: [], scheduling: [], budgetExhaustionReason: "provider_failed", providerStatus: "failed" } }, topFactors: [] });
    assert.equal(report.reportSummary.completionStatus, completionStatus);
    assert.equal(report.reportSummary.discoveryDiagnostics, undefined);
    assert.match(presentation, new RegExp(customerLabel));
  }
  assert.match(presentation, /personalCompletionPresentation\(summary\?\.completionStatus\)/);
  assert.match(presentation, /aria-label="Investigation completion status"/);
});

test("checkout presents canonical personal scope and blocks disabled indirect entry", async () => {
  const intakePage = await readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8");
  assert.match(intakePage, /canonicalRouting\.primaryInvestigationType === "PERSON_IDENTITY"/);
  assert.match(intakePage, /canonicalPersonalInvestigation && !personalIdentityEnabled/);
  assert.match(intakePage, /checkoutRouting\.primaryInvestigationType === "PERSON_IDENTITY"/);
  assert.match(intakePage, /checkoutIsPersonal \? "Personal Identity" : "Business"/);
});

test("business reports keep missing legacy completion status unknown", async () => {
  const presentation = await readFile(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
  assert.match(presentation, /completionStatus \? levelLabel\(report\.reportSummary\.completionStatus\) : "Status not recorded"/);
  assert.doesNotMatch(presentation, /completionStatus \|\| "NO_EVIDENCE_ABSTAIN"/);
});

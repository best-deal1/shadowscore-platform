import assert from "node:assert/strict";
import test from "node:test";

import { resolveInvestigationRouting, reportRendererForRouting } from "../lib/investigationRouting.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";
import { classifyTarget } from "../lib/targetClassifier/index.ts";
import { investigationCompletionStatus } from "../lib/reportCoverage.ts";
import { presentReportForEndUser } from "../lib/workspace.ts";
import { ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";

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

test("coverage outcomes remain distinct", () => {
  assert.equal(investigationCompletionStatus([provider("UNSUPPORTED_JURISDICTION")], 0), "UNSUPPORTED_JURISDICTION");
  assert.equal(investigationCompletionStatus([provider("PROVIDER_UNAVAILABLE", "unavailable")], 0), "PROVIDER_UNAVAILABLE");
  assert.equal(investigationCompletionStatus([provider("NO_AUTHORITATIVE_MATCH")], 1), "COMPLETED_WITH_UNRESOLVED_EVIDENCE");
  assert.equal(investigationCompletionStatus([], 0), "NO_EVIDENCE_ABSTAIN");
});

test("paid report presentation preserves routing while removing internal provider data", () => {
  const routing = resolveInvestigationRouting({ target: "sharon@shl.co.il", scanMode: "personal" });
  const report = presentReportForEndUser({ reportId: "paid-1", title: "Report", entity: "shl.co.il", target: "shl.co.il", platform: "admin", scanMode: "personal", stage: "Warning", createdAt: new Date(0).toISOString(), reportStatus: "ready", source: "payment_unlock_pipeline", providerResults: [], reportSummary: { message: "Complete", investigationRouting: routing, investigationType: routing.primaryInvestigationType, completionStatus: "NO_EVIDENCE_ABSTAIN" }, topFactors: [] });
  assert.equal(report.providerResults, undefined);
  assert.deepEqual(report.reportSummary.investigationRouting, routing);
  assert.equal(reportRendererForRouting(report.reportSummary.investigationRouting), "business");
});

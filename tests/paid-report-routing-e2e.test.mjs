import assert from "node:assert/strict";
import test from "node:test";

import { buildReadyReport } from "../lib/reportPipeline.ts";
import { executiveReportKind, reportEmailRouting } from "../lib/reportRouting.ts";
import { createIntake, presentReportForEndUser } from "../lib/workspace.ts";

function intake(target) {
  return { intakeId: `acceptance-${target}`, userId: "fixture-user", scanMode: "personal", target, platform: "Personal Identity", email: "buyer@example.test", fileNames: [], visibleSignalCategories: [], paymentStatus: "paid", reportStatus: "generating", createdAt: "2026-09-03T00:00:00.000Z" };
}
const paymentIntent = { id: "paid-fixture", planName: "Full Investigation", price: "$1", method: "test", paymentStatus: "paid", createdAt: "2026-09-03T00:00:00.000Z" };

async function generateAndRecover(target) {
  const fixture = intake(target);
  const persistedIntake = await createIntake({ userId: fixture.userId, email: fixture.email, name: "Fixture", startedAt: fixture.createdAt }, { scanMode: fixture.scanMode, target: fixture.target, platform: fixture.platform, email: fixture.email, fileNames: fixture.fileNames, visibleSignalCategories: fixture.visibleSignalCategories });
  const recoveredIntake = JSON.parse(JSON.stringify(persistedIntake));
  const generated = await buildReadyReport({ intake: { ...recoveredIntake, paymentStatus: "paid", reportStatus: "generating" }, paymentIntent });
  // JSON serialization mirrors the report metadata JSONB boundary. End-user presentation mirrors GET /api/reports/[reportId].
  return presentReportForEndUser(JSON.parse(JSON.stringify(generated)));
}

test("paid Executive Report keeps corporate seed and routes the persisted record to business coverage", async () => {
  const report = await generateAndRecover("sharon@shl.co.il");
  const routing = reportEmailRouting(report);
  assert.equal(routing?.submittedSeed, "sharon@shl.co.il");
  assert.equal(routing?.emailClassification, "CORPORATE_DOMAIN");
  assert.equal(routing?.primaryInvestigationEntity, "shl.co.il");
  assert.equal(routing?.localPartIdentityExpansionPermitted, false);
  assert.equal(report.target, "sharon@shl.co.il");
  assert.equal(report.entity, "shl.co.il");
  assert.equal(report.reportSummary?.submittedSeed, "sharon@shl.co.il");
  assert.equal(report.reportSummary?.primaryEntity, "shl.co.il");
  assert.equal(report.reportSummary?.investigationType, "BUSINESS_DOMAIN_LEGAL_ENTITY");
  assert.equal(executiveReportKind(report), "business_domain_legal_entity");
  assert.equal(report.reportSummary?.publicIdentityCandidates?.length, 0);
  const executed = report.reportSummary?.sourceProvenance?.map((source) => source.label) || [];
  assert.ok(executed.includes("business profile"), "business discovery must execute");
  assert.ok(!executed.includes("external identity"), "person discovery must not execute");
  assert.deepEqual(report.reportSummary?.providerCoverageGaps, [{ providerId: "authoritative-company", code: "PROVIDER_UNAVAILABLE", jurisdiction: "Israel", message: "Authoritative Israeli company registry coverage is unavailable for this investigation." }]);
});

test("paid Executive Report keeps free-mail identity routing after report recovery", async () => {
  const report = await generateAndRecover("acceptance.person@gmail.com");
  assert.equal(reportEmailRouting(report)?.emailClassification, "FREE_MAIL");
  assert.equal(reportEmailRouting(report)?.primaryInvestigationEntity, "acceptance.person@gmail.com");
  assert.equal(executiveReportKind(report), "personal_identity");
  assert.equal(report.reportSummary?.investigationType, "PERSONAL_IDENTITY");
  assert.equal(report.reportSummary?.providerCoverageGaps, undefined);
});

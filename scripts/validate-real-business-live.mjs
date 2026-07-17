import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");
const outDir = join(tmpdir(), "shadowscore-real-business-live-validation");
rmSync(outDir, { recursive: true, force: true });

execFileSync(process.execPath, [
  tscPath,
  "lib/reportPipeline.ts",
  "--outDir",
  outDir,
  "--module",
  "commonjs",
  "--target",
  "es2020",
  "--jsx",
  "react-jsx",
  "--esModuleInterop",
  "--skipLibCheck",
  "--moduleResolution",
  "node",
  "--noEmit",
  "false",
], { stdio: "inherit" });

const { buildReadyReport } = require(join(outDir, "reportPipeline.js"));

const benchmarkName = "validate:real-business-live";
const submittedTargets = [
  { target: "stripe.com", expected: /\bStripe\b/i },
  { target: "cloudflare.com", expected: /\bCloudflare\b/i },
  { target: "shopify.com", expected: /\bShopify\b/i },
];
const requiredEvidenceCategories = ["domain_infrastructure", "domain_registration", "ssl", "security_headers", "business_profile"];
const createdAt = "2026-07-16T00:00:00.000Z";

function providerCategory(providerId) {
  if (providerId === "dns") return "domain_infrastructure";
  if (providerId === "whois") return "domain_registration";
  if (providerId === "ssl") return "ssl";
  if (providerId === "security-headers") return "security_headers";
  if (["business-profile", "website-metadata", "authoritative-company"].includes(providerId)) return "business_profile";
  return providerId;
}

function hasValue(item) {
  const value = String(item?.value || "").trim().toLowerCase();
  return Boolean(value && value !== "unavailable" && value !== "not checked");
}

function businessNameFor(report) {
  return report.reportSummary?.identityResolution?.primaryIdentity?.displayName !== "Unknown"
    ? report.reportSummary.identityResolution.primaryIdentity.displayName
    : report.reportSummary?.businessNarrative?.businessName || report.reportSummary?.identityProfile?.businessName?.value || "";
}

function isUnresolvedBusiness(report) {
  const name = businessNameFor(report).trim();
  return !name || name === "Insufficient Public Evidence" || name.toLowerCase() === String(report.target).toLowerCase() || name === "Unknown";
}

function providerEvidence(report) {
  return report.providerResults.map((result) => ({
    providerId: result.providerId,
    status: result.status,
    errors: result.errors,
    evidence: result.evidence,
    resolverEvidence: result.metadata?.resolverEvidence,
    extractedIdentityFields: result.metadata?.extractedIdentityFields,
    httpOutcome: result.metadata?.httpOutcome,
    httpDiagnostics: result.metadata?.httpDiagnostics,
  }));
}

function isFalseIdentity(row) {
  return row.organizationResolved && !row.expected.test(row.organization);
}

const rows = [];
for (const entry of submittedTargets) {
  const target = entry.target;
  const intake = {
    intakeId: `real-business-live-${target}`,
    userId: "real-business-live-validation",
    scanMode: "website",
    target,
    platform: "web",
    fileNames: [],
    visibleSignalCategories: [],
    paymentStatus: "paid",
    reportStatus: "generating",
    createdAt,
  };
  const paymentIntent = { id: `pi-real-business-live-${target}`, intakeId: intake.intakeId, planName: "Real Business Live Validation", price: "$0.00", method: "validation", paymentStatus: "paid", createdAt };
  const report = await buildReadyReport({ intake, paymentIntent, reportId: `rpt-real-business-live-${target}`, createdAt });
  const completedProviders = report.providerResults.filter((result) => result.status === "completed");
  const acquiredCategories = new Set(completedProviders.filter((result) => result.evidence.some(hasValue)).map((result) => providerCategory(result.providerId)));
  const missingEvidenceCategories = requiredEvidenceCategories.filter((category) => !acquiredCategories.has(category));
  const acquisitionFailures = report.providerResults.filter((result) => result.status !== "completed").map((result) => `${result.providerId}:${result.errors.join(";") || result.status}`);
  const identityResolution = report.reportSummary?.identityResolution;
  const row = {
    target,
    expected: entry.expected,
    organization: businessNameFor(report) || "Unknown",
    organizationResolved: !isUnresolvedBusiness(report),
    evidenceAcquired: acquiredCategories.size > 0,
    acquiredCategories: [...acquiredCategories].join(", "),
    unresolved: isUnresolvedBusiness(report),
    acquisitionFailures,
    missingEvidenceCategories,
    rawProviderEvidence: providerEvidence(report),
    providerEvidenceEnteringResolver: identityResolution?.resolverDiagnostics?.rawProviderEvidence || [],
    candidateOrganizations: identityResolution?.resolverDiagnostics?.candidateOrganizations || [],
    finalIdentityResolution: {
      status: identityResolution?.identityResolutionStatus,
      primaryIdentity: identityResolution?.primaryIdentity,
      canonicalOrganization: identityResolution?.canonicalOrganization,
      missingEvidence: identityResolution?.missingEvidence,
      contradictions: identityResolution?.contradictions,
    },
  };
  row.falseIdentity = isFalseIdentity(row);
  rows.push(row);
}

const trueResolved = rows.filter((row) => row.organizationResolved && !row.falseIdentity).length;
const falseResolved = rows.filter((row) => row.falseIdentity).length;
const falseUnresolved = rows.filter((row) => row.unresolved).length;
const confusionMatrix = { trueResolved, falseResolved, falseUnresolved };
const metrics = {
  organizationResolutionRate: `${trueResolved}/${rows.length}`,
  recall: `${trueResolved}/${rows.length}`,
  evidenceAcquisitionRate: `${rows.filter((row) => row.evidenceAcquired).length}/${rows.length}`,
  falseIdentityRate: `${falseResolved}/${rows.length}`,
  unresolvedBusinesses: rows.filter((row) => row.unresolved).map((row) => row.target),
  acquisitionFailures: Object.fromEntries(rows.map((row) => [row.target, row.acquisitionFailures])),
  missingEvidenceCategories: Object.fromEntries(rows.map((row) => [row.target, row.missingEvidenceCategories])),
};

console.table(rows.map((row) => ({ target: row.target, organization: row.organization, organizationResolved: row.organizationResolved, falseIdentity: row.falseIdentity, acquiredCategories: row.acquiredCategories, acquisitionFailures: row.acquisitionFailures.join(" | "), missingEvidenceCategories: row.missingEvidenceCategories.join(", ") })));
console.log(`${benchmarkName} raw provider evidence:`, JSON.stringify(Object.fromEntries(rows.map((row) => [row.target, row.rawProviderEvidence])), null, 2));
console.log(`${benchmarkName} candidate-resolution diagnostics:`, JSON.stringify(Object.fromEntries(rows.map((row) => [row.target, { providerEvidenceEnteringResolver: row.providerEvidenceEnteringResolver, candidateOrganizations: row.candidateOrganizations, finalIdentityResolution: row.finalIdentityResolution }])), null, 2));
console.log(`${benchmarkName} metrics:`, JSON.stringify(metrics, null, 2));
console.log(`${benchmarkName} confusion matrix:`, JSON.stringify(confusionMatrix, null, 2));

assert.equal(rows.filter((row) => row.evidenceAcquired).length, rows.length, "production acquisition must collect evidence for every submitted real business target");
assert.equal(falseResolved, 0, "false identity rate must be zero");
for (const row of rows) assert.ok(row.expected.test(row.organization), `${row.target} must resolve to the expected known business family`);
assert.equal(trueResolved, rows.length, "known-business recall must be 3/3 for this live benchmark");
assert.ok(rows.every((row) => row.missingEvidenceCategories.length <= 2), "live acquisition should cover most production evidence categories for each target");

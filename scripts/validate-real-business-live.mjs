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
const submittedTargets = ["stripe.com", "cloudflare.com", "shopify.com"];
const requiredEvidenceCategories = ["domain_infrastructure", "domain_registration", "ssl", "security_headers", "business_profile"];
const createdAt = "2026-07-16T00:00:00.000Z";

function providerCategory(providerId) {
  if (providerId === "dns") return "domain_infrastructure";
  if (providerId === "whois") return "domain_registration";
  if (providerId === "ssl") return "ssl";
  if (providerId === "security-headers") return "security_headers";
  if (providerId === "business-profile") return "business_profile";
  return providerId;
}

function hasValue(item) {
  const value = String(item?.value || "").trim().toLowerCase();
  return Boolean(value && value !== "unavailable" && value !== "not checked");
}

function businessNameFor(report) {
  return report.reportSummary?.businessNarrative?.businessName || report.reportSummary?.identityProfile?.businessName?.value || "";
}

function isUnresolvedBusiness(report) {
  const name = businessNameFor(report).trim();
  return !name || name === "Insufficient Public Evidence" || name.toLowerCase() === String(report.target).toLowerCase();
}

function isFalsePositive(report) {
  const name = businessNameFor(report).trim();
  const businessProfile = report.providerResults.find((result) => result.providerId === "business-profile");
  const publicNameEvidence = businessProfile?.evidence?.some((item) => /business name|profile title|organization/i.test(item.label) && hasValue(item));
  return Boolean(name && name !== "Insufficient Public Evidence" && !publicNameEvidence);
}

const rows = [];
for (const target of submittedTargets) {
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
  rows.push({
    target,
    organization: businessNameFor(report) || "Unknown",
    organizationResolved: !isUnresolvedBusiness(report),
    evidenceAcquired: acquiredCategories.size > 0,
    acquiredCategories: [...acquiredCategories].join(", "),
    falsePositive: isFalsePositive(report),
    unresolved: isUnresolvedBusiness(report),
    acquisitionFailures,
    missingEvidenceCategories,
  });
}

const metrics = {
  organizationResolutionRate: `${rows.filter((row) => row.organizationResolved).length}/${rows.length}`,
  evidenceAcquisitionRate: `${rows.filter((row) => row.evidenceAcquired).length}/${rows.length}`,
  falsePositiveRate: `${rows.filter((row) => row.falsePositive).length}/${rows.length}`,
  unresolvedBusinesses: rows.filter((row) => row.unresolved).map((row) => row.target),
  acquisitionFailures: Object.fromEntries(rows.map((row) => [row.target, row.acquisitionFailures])),
  missingEvidenceCategories: Object.fromEntries(rows.map((row) => [row.target, row.missingEvidenceCategories])),
};

console.table(rows.map((row) => ({ ...row, acquisitionFailures: row.acquisitionFailures.join(" | "), missingEvidenceCategories: row.missingEvidenceCategories.join(", ") })));
console.log(`${benchmarkName} metrics:`, JSON.stringify(metrics, null, 2));

assert.equal(rows.filter((row) => row.evidenceAcquired).length, rows.length, "production acquisition must collect evidence for every submitted real business target");
assert.equal(rows.filter((row) => row.falsePositive).length, 0, "resolved organizations must be supported by acquired production business-profile evidence");
assert.ok(rows.every((row) => row.missingEvidenceCategories.length <= 2), "live acquisition should cover most production evidence categories for each target");

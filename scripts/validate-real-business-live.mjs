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
const submittedTargets = ["microsoft.com", "amazon.com", "google.com", "openai.com", "canva.com", "wix.com", "cloudflare.com", "stripe.com", "checkpoint.com", "monday.com", "leumi.co.il", "hapoalim.co.il", "ksp.co.il", "keter.com", "shadowscore.io"];
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
  const resolved = report.reportSummary?.businessIdentityResolution?.canonicalIdentity;
  if (resolved?.canonicalDisplayName && resolved.canonicalDisplayName !== "Unknown" && resolved.identityStatus !== "UNRESOLVED") return false;
  const name = businessNameFor(report).trim();
  return !name || name === "Insufficient Public Evidence" || name.toLowerCase() === String(report.target).toLowerCase();
}

function isFalsePositive(report) {
  const name = businessNameFor(report).trim();
  const resolved = report.reportSummary?.businessIdentityResolution?.canonicalIdentity;
  const canonicalResolved = Boolean(resolved?.canonicalDisplayName && resolved.canonicalDisplayName !== "Unknown" && resolved.identityStatus !== "UNRESOLVED");
  return Boolean(name && name !== "Insufficient Public Evidence" && !canonicalResolved);
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
    identityContradictions: report.reportSummary?.businessIdentityResolution?.contradictions || [],
    fallbackContradictions: [
      report.reportSummary?.identityProfile?.businessIdentity?.businessName?.value,
      report.reportSummary?.identityProfile?.businessIdentity?.businessType?.value,
      report.reportSummary?.identityProfile?.businessIdentity?.country?.value,
      report.reportSummary?.identityProfile?.businessIdentity?.knownDomains?.value,
      report.reportSummary?.businessNarrative?.businessName,
      report.reportSummary?.businessNarrative?.primaryDomain,
      report.reportSummary?.businessNarrative?.sections?.find((section) => section.id === "whatWeFound")?.body?.[0],
      report.reportSummary?.businessNarrative?.sections?.find((section) => section.id === "executiveSummary")?.body?.[0],
    ].filter((value) => /^(Unknown|Small Business|Business name evidence is missing|Business profile title missing)$/i.test(String(value || "").trim()) || /Business name evidence is missing|Business profile title missing|presented as small business/i.test(String(value || ""))),
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
assert.equal(rows.filter((row) => row.organizationResolved).length, rows.length, "canonical identity must resolve every benchmark target");
assert.equal(rows.flatMap((row) => row.identityContradictions).length, 0, "canonical identity benchmark targets must not produce identity contradictions");
assert.equal(rows.flatMap((row) => row.fallbackContradictions).length, 0, "resolved benchmark reports must not render identity fallback contradictions");

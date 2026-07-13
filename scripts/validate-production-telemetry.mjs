import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const outDir = join(tmpdir(), "shadowscore-production-telemetry-validation");
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

const targetDomains = [
  "barinaeng.co.il",
  "gadgetdeals.co.il",
  "ynet.co.il",
  "stripe.com",
  "microsoft.com",
  "bankhapoalim.co.il",
];

const createdAt = "2026-07-13T00:00:00.000Z";
const results = [];

for (const domain of targetDomains) {
  const intake = {
    intakeId: `telemetry-${domain}`,
    userId: "production-telemetry-validation",
    scanMode: "website",
    target: domain,
    platform: "web",
    email: `ops@${domain}`,
    fileNames: [],
    visibleSignalCategories: [],
    paymentStatus: "paid",
    reportStatus: "generating",
    createdAt,
  };
  const paymentIntent = {
    id: `pi-telemetry-${domain}`,
    intakeId: intake.intakeId,
    planName: "Production Telemetry Validation",
    price: "$0.00",
    method: "validation",
    paymentStatus: "paid",
    createdAt,
  };

  const report = await buildReadyReport({ intake, paymentIntent, reportId: `rpt-telemetry-${domain}`, createdAt });
  assert.equal(report.reportStatus, "ready");
  assert.equal(report.target, domain);
  assert.ok(report.reportSummary?.execution, `${domain} should include report execution telemetry`);
  assert.ok(Array.isArray(report.providerResults), `${domain} should include provider results`);
  assert.ok(report.reportSummary?.technicalDetails, `${domain} should include provider execution details`);
  results.push({
    domain,
    providersExecuted: report.reportSummary.execution.providersExecuted,
    evidenceCollected: report.reportSummary.execution.evidenceCollected,
    decisionConfidence: report.reportSummary.execution.decisionConfidence,
  });
}

console.table(results);
console.log("production telemetry validation passed");

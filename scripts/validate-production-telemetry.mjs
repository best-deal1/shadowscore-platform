import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { promises as dns } from "node:dns";

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const outDir = join(tmpdir(), "shadowscore-production-telemetry-validation");
const productionTargets = [
  "google.com",
  "stripe.com",
  "microsoft.com",
  "ynet.co.il",
  "bankhapoalim.co.il",
  "leumi.co.il",
];

rmSync(outDir, { recursive: true, force: true });
execFileSync(npxCommand, [
  "tsc",
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

function withTimeout(promise, label, ms = 4_000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

for (const method of ["resolve4", "resolve6", "resolveMx", "resolveNs", "resolveTxt", "resolveCname"]) {
  const original = dns[method].bind(dns);
  dns[method] = (...args) => withTimeout(original(...args), `DNS ${method}`);
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => originalFetch(input, {
  ...init,
  signal: init.signal || AbortSignal.timeout(4_000),
});

const require = createRequire(import.meta.url);
const { buildReadyReport } = require(join(outDir, "reportPipeline.js"));

const createdAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
const rows = await Promise.all(productionTargets.map(async (target) => {
  const targetSlug = target.replace(/[^a-z0-9]/gi, "-");
  const report = await buildReadyReport({
    intake: {
      intakeId: `prod-telemetry-${targetSlug}`,
      userId: "production-telemetry-validation",
      scanMode: "website",
      target,
      platform: "direct",
      caseType: "pre_purchase",
      email: `ops@${target}`,
      fileNames: [],
      visibleSignalCategories: ["domain", "website"],
      createdAt,
      status: "paid",
    },
    paymentIntent: {
      id: `pi-prod-telemetry-${targetSlug}`,
      intakeId: `prod-telemetry-${targetSlug}`,
      amount: 499,
      currency: "USD",
      paymentStatus: "paid",
      createdAt,
    },
    reportId: `report-prod-telemetry-${targetSlug}`,
    createdAt,
  });

  if (report.reportStatus !== "ready") {
    throw new Error(`${target} did not produce a ready report.`);
  }

  return {
    target,
    reportStatus: report.reportStatus,
    decision: report.reportSummary.decision.decision,
    providersExecuted: report.reportSummary.execution.providersExecuted,
    evidenceCollected: report.reportSummary.execution.evidenceCollected,
  };
}));

console.table(rows);

process.exit(0);

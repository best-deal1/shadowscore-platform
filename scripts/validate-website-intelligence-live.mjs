import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const load = async (name) => JSON.parse(await readFile(resolve(root, "validation/website-intelligence", name), "utf8"));

if (process.env.WEBSITE_INTELLIGENCE_LIVE !== "1") {
  console.log("Website Intelligence live validation skipped. Set WEBSITE_INTELLIGENCE_LIVE=1 to enable external requests.");
  process.exit(0);
}

const require = createRequire(import.meta.url);
const outDir = resolve(tmpdir(), "shadowscore-website-intelligence-live");
rmSync(outDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"),
  "lib/websiteIntelligence/index.ts",
  "--outDir", outDir,
  "--module", "commonjs",
  "--target", "es2022",
  "--esModuleInterop",
  "--skipLibCheck",
  "--moduleResolution", "node",
  "--noEmit", "false",
], { cwd: root, stdio: "inherit" });
const { investigateWebsite } = require(resolve(outDir, "index.js"));

const [corpus, inventory, matrix] = await Promise.all([
  load("corpus.json"),
  load("providers.json"),
  load("matrix.json"),
]);
const required = new Set(inventory.providers.filter((provider) => provider.requiredForPilot).map((provider) => provider.moduleId));

const rows = await Promise.all(corpus.sites.map(async (site) => {
  const started = Date.now();
  const report = await investigateWebsite({ target: site.domain, timeoutMs: 5_000, retries: 1 });
  return { site, report, durationMs: Date.now() - started };
}));

const modules = rows.flatMap(({ site, report }) => report.modules.map((module) => ({ site: site.domain, ...module })));
const requiredRuns = modules.filter((module) => required.has(module.moduleId));
const completed = modules.filter((module) => module.status === "completed");
const durations = rows.map((row) => row.durationMs).sort((a, b) => a - b);
const rate = (numerator, denominator) => denominator === 0 ? 0 : numerator / denominator;
const percentile = (values, percentileValue) => values[Math.max(0, Math.ceil(values.length * percentileValue) - 1)] ?? 0;

const metrics = {
  corpusSize: rows.length,
  providerInventorySize: inventory.providers.length,
  siteCompletionRate: rate(rows.filter(({ report }) => report.modules.some((module) => module.status === "completed")).length, rows.length),
  requiredModuleCompletionRate: rate(requiredRuns.filter((module) => module.status === "completed").length, requiredRuns.length),
  evidenceCoverageRate: rate(completed.filter((module) => module.evidence.length > 0).length, completed.length),
  p95DurationMs: percentile(durations, 0.95),
  unexpectedFailureRate: rate(modules.filter((module) => module.status === "failed").length, modules.length),
};

const target = matrix.baseline;
const checks = {
  corpusSize: metrics.corpusSize === target.corpusSize,
  providerInventorySize: metrics.providerInventorySize === target.providerInventorySize,
  siteCompletionRate: metrics.siteCompletionRate >= target.minimumSiteCompletionRate,
  requiredModuleCompletionRate: metrics.requiredModuleCompletionRate >= target.minimumRequiredModuleCompletionRate,
  evidenceCoverageRate: metrics.evidenceCoverageRate >= target.minimumEvidenceCoverageRate,
  p95DurationMs: metrics.p95DurationMs <= target.maximumP95DurationMs,
  unexpectedFailureRate: metrics.unexpectedFailureRate <= target.maximumUnexpectedFailureRate,
};
const ready = Object.values(checks).every(Boolean);

console.table(rows.map(({ site, report, durationMs }) => ({
  domain: site.domain,
  completed: report.modules.filter((module) => module.status === "completed").length,
  unavailable: report.modules.filter((module) => module.status === "unavailable").length,
  failed: report.modules.filter((module) => module.status === "failed").length,
  durationMs,
})));
console.log(JSON.stringify({ metrics, targets: target, checks, pilotReadiness: ready ? "recommended" : "not-ready" }, null, 2));

if (!ready) {
  console.error("Website Intelligence is not ready for a pilot. Review the failed acceptance targets above.");
  process.exitCode = 1;
} else {
  console.log("Website Intelligence meets the acceptance targets for a limited pilot.");
}

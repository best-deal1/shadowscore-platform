import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const outDir = join(tmpdir(), "shadowscore-decision-validation");
rmSync(outDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  tscPath,
  "lib/decisionEngine/validation.ts",
  "--outDir",
  outDir,
  "--module",
  "commonjs",
  "--target",
  "es2020",
  "--esModuleInterop",
  "--skipLibCheck",
  "--moduleResolution",
  "node",
  "--noEmit",
  "false",
], { stdio: "inherit" });

const { runDecisionValidationSuite } = require(join(outDir, "decisionEngine", "validation.js"));
const results = runDecisionValidationSuite();
console.table(results.map((result) => ({
  case: result.label,
  expected: result.expected,
  actual: result.actual,
  passed: result.passed,
  positive: result.counts.positiveEvidenceCount,
  missing: result.counts.missingEvidenceCount,
  negative: result.counts.negativeEvidenceCount,
  confidence: result.counts.verificationConfidence,
  completeness: result.counts.evidenceCompleteness,
})));

const failures = results.filter((result) => !result.passed);
if (failures.length > 0) {
  console.error("Decision validation failures:", failures);
  process.exit(1);
}

import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const outDir = join(tmpdir(), "shadowscore-decision-integrity-validation");
rmSync(outDir, { recursive: true, force: true });
execFileSync(process.execPath, [tscPath, "lib/decisionEngine/integrityValidation.ts", "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node", "--noEmit", "false"], { stdio: "inherit" });
const { runDecisionIntegrityValidationSuite } = require(join(outDir, "decisionEngine", "integrityValidation.js"));
const results = runDecisionIntegrityValidationSuite();
console.table(results.rows);
console.log("Negative fixture:", results.negativeFixture);
console.log("Missing DMARC fixture decision:", results.missingDmarc);

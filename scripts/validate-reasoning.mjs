import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const outDir = join(tmpdir(), "shadowscore-reasoning-validation");
rmSync(outDir, { recursive: true, force: true });
execFileSync("npx", ["tsc", "scripts/validate-reasoning.ts", "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node", "--noEmit", "false"], { stdio: "inherit" });
const require = createRequire(import.meta.url);
const { runReasoningValidationSuite } = require(join(outDir, "scripts", "validate-reasoning.js"));
const results = runReasoningValidationSuite();
console.table(results.map((result) => ({ case: result.label, passed: result.passed, steps: result.steps, graphNodes: result.graphNodes, graphEdges: result.graphEdges, decision: result.decision, confidence: result.confidence })));
for (const result of results) {
  console.log(`\n# ${result.label}`);
  console.log("Reasoning graph:", result.graph);
  console.log("Inference chain:", result.inferenceChain);
  console.log("Evidence trace:", result.evidenceTrace);
  console.log("Decision explanation:", result.decisionExplanation);
  console.log("Confidence propagation:", result.confidencePropagation);
}
const failures = results.filter((result) => !result.passed);
if (failures.length > 0) {
  console.error("Reasoning validation failures:", failures);
  process.exit(1);
}

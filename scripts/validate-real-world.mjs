import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const outDir = join(tmpdir(), "shadowscore-real-world-validation");
rmSync(outDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  tscPath,
  "lib/decisionEngine/validation.ts",
  "lib/businessProfileEngine/index.ts",
  "lib/narrative/templates.ts",
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

const { buildVerificationDecision } = require(join(outDir, "decisionEngine", "model.js"));
const { referenceProviderSnapshot } = require(join(outDir, "decisionEngine", "snapshots.js"));
const { buildBusinessProfile } = require(join(outDir, "businessProfileEngine", "index.js"));
const { verificationTemplate } = require(join(outDir, "narrative", "templates.js"));

const cases = [
  { target: "Microsoft", snapshot: "strong-business", before: "PASS" },
  { target: "Stripe", snapshot: "integrity-stripe", before: "PASS" },
  { target: "Leumi", snapshot: "new-business", before: "REVIEW", targetType: "regulatedBank" },
  { target: "Bank Hapoalim", snapshot: "integrity-bankhapoalim", before: "REVIEW", targetType: "regulatedBank" },
  { target: "GadgetDeals", snapshot: "integrity-gadgetdeals", before: "REVIEW" },
  { target: "Barina", snapshot: "c-data", before: "REVIEW" },
  { target: "AllInCell", snapshot: "gadget-deals", before: "REVIEW" },
];

const rows = cases.map((testCase) => {
  const providerResults = referenceProviderSnapshot(testCase.snapshot);
  const profile = buildBusinessProfile({ providerResults, target: testCase.target });
  const decision = buildVerificationDecision({ providerResults, audience: "paid", targetType: testCase.targetType || "website" });
  const narrativeOpening = verificationTemplate({ hasContradictions: profile.contradictionSignals.length > 0, verificationNeeds: profile.missingEvidence, businessName: profile.businessName, primaryDomain: profile.primaryDomain, businessType: profile.businessType, decision: decision.decision, confidence: String(decision.confidenceScore), coverage: String(decision.evidenceCoverageScore), recommendation: decision.recommendedAction, nextActions: [], positiveFindings: [], evidenceUsed: [], relationshipCount: 0, entityCount: 0 })[0];
  return {
    target: testCase.target,
    entityClass: profile.businessType,
    verifiedIdentity: profile.businessName,
    gaps: profile.missingEvidence.join(" | ") || "None",
    contradictions: profile.contradictionSignals.map((item) => item.title).join(" | ") || "None",
    decision: decision.decision,
    before: testCase.before,
    narrativeOpening,
    reasoning: decision.reasons.join(" "),
  };
});

console.table(rows.map(({ target, entityClass, verifiedIdentity, gaps, contradictions, decision, before, narrativeOpening }) => ({ target, entityClass, verifiedIdentity, gaps, contradictions, before, after: decision, narrativeOpening })));

const gadget = rows.find((row) => row.target === "GadgetDeals");
if (!gadget || gadget.narrativeOpening !== "Some public information could not be independently verified.") {
  console.error("GadgetDeals should use neutral verification wording when no contradiction exists.", gadget);
  process.exit(1);
}
for (const row of rows) {
  if (row.narrativeOpening === "Inconsistent information was found." && row.contradictions === "None") {
    console.error("Contradiction wording appeared without a contradiction.", row);
    process.exit(1);
  }
}

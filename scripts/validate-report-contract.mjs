import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const expectedSections = [
  ["executiveSummary", "Executive Summary"],
  ["whatWeFound", "What We Found"],
  ["whatIncreasesConfidence", "What Increases Confidence"],
  ["whatRequiresVerification", "What Requires Verification"],
  ["recommendedNextSteps", "Recommended Next Steps"],
  ["decisionCost", "Cost of Uncertainty"],
  ["investigationStory", "Investigation Story"],
  ["evidenceUsed", "Evidence Used"],
];

const sectionSource = readFileSync(new URL("../lib/narrative/sections.ts", import.meta.url), "utf8");
const actualSections = Array.from(sectionSource.matchAll(/\{ id: "([^"]+)", title: "([^"]+)", body:/g), ([, id, title]) => [id, title]);
assert.deepEqual(actualSections, expectedSections, "Narrative sections must use the canonical report order and titles.");

const reportPage = readFileSync(new URL("../app/report/page.tsx", import.meta.url), "utf8");
for (const [, title] of expectedSections) assert.ok(!reportPage.includes(`>${title}<`), `Report UI must obtain ${title} from the report contract rather than duplicate it.`);
console.log(`Report contract validated: ${actualSections.length} canonical sections.`);

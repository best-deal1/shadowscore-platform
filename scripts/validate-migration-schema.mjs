import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const migrationNames = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
const evidenceItemDefinitions = [];
const decisionDefinitions = [];

for (const name of migrationNames) {
  const sql = await readFile(new URL(name, migrationsDirectory), "utf8");
  if (/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?evidence_items\b/iu.test(sql)) {
    evidenceItemDefinitions.push(name);
  }
  if (/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?decisions\b/iu.test(sql)) decisionDefinitions.push(name);
}

assert.deepEqual(
  evidenceItemDefinitions,
  ["20260724020000_findings_workspace.sql"],
  `evidence_items must have one canonical migration definition, found: ${evidenceItemDefinitions.join(", ") || "none"}`,
);

console.log(`Validated one evidence_items schema definition across ${migrationNames.length} migrations.`);
assert.deepEqual(decisionDefinitions,["20260724030000_decision_workspace.sql"],`decisions must have one canonical migration definition, found: ${decisionDefinitions.join(", ")||"none"}`);
console.log("Validated the canonical Decision schema definition.");

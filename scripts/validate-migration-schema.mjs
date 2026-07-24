import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const migrationNames = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
const evidenceItemDefinitions = [];

for (const name of migrationNames) {
  const sql = await readFile(new URL(name, migrationsDirectory), "utf8");
  if (/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?evidence_items\b/iu.test(sql)) {
    evidenceItemDefinitions.push(name);
  }
}

assert.deepEqual(
  evidenceItemDefinitions,
  ["20260724020000_findings_workspace.sql"],
  `evidence_items must have one canonical migration definition, found: ${evidenceItemDefinitions.join(", ") || "none"}`,
);

console.log(`Validated one evidence_items schema definition across ${migrationNames.length} migrations.`);

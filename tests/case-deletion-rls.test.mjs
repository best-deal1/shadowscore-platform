import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../supabase/migrations/20260815000000_authorize_case_deletion.sql", import.meta.url);
const migration = await readFile(migrationUrl, "utf8");
const normalized = migration.replace(/\s+/gu, " ").trim().toLowerCase();

test("case deletion migration grants only the required table privilege", () => {
  assert.match(normalized, /grant delete on public\.cases to authenticated;/u);
  assert.doesNotMatch(normalized, /grant all/u);
});

test("case deletion policy requires an active same-organization membership", () => {
  assert.match(normalized, /create policy "workspace editors delete organization cases" on public\.cases for delete to authenticated using/u);
  assert.match(normalized, /membership\.organization_id = cases\.organization_id/u);
  assert.match(normalized, /membership\.user_id = auth\.uid\(\)/u);
  assert.match(normalized, /membership\.status = 'active'/u);
});

test("case deletion policy allows editors and excludes viewers", () => {
  assert.match(normalized, /membership\.role in \('owner', 'manager', 'analyst'\)/u);
  assert.doesNotMatch(normalized, /membership\.role in \([^)]*'viewer'/u);
});

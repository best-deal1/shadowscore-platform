import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260802010000_connect_investigations_to_workspace.sql", import.meta.url);
const migration = await readFile(migrationUrl, "utf8");

test("saved investigations are backfilled into their owner's active workspace", () => {
  assert.match(migration, /distinct on \(membership\.user_id\)/);
  assert.match(migration, /membership\.status = 'active'/);
  assert.match(migration, /update public\.intakes intake[\s\S]*intake\.organization_id is null/);
});

test("existing and future investigations receive one workspace case", () => {
  assert.match(migration, /before insert or update of user_id, organization_id on public\.intakes/);
  assert.match(migration, /after insert or update of organization_id on public\.intakes/);
  assert.match(migration, /create unique index if not exists cases_organization_investigation_id_idx/);
  assert.match(migration, /on conflict \(organization_id, investigation_id\) do nothing/g);
});

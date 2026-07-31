import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationName = "20260731000000_purchase_flow_baseline.sql";
const sql = await readFile(new URL(`../supabase/migrations/${migrationName}`, import.meta.url), "utf8");
const required = {
  profiles: ["id", "email", "full_name", "role", "created_at", "updated_at"],
  intakes: ["id", "user_id", "intake_id", "scan_mode", "target", "platform", "case_type", "email", "file_names", "visible_signal_categories", "payment_status", "report_status", "created_at", "updated_at"],
  reports: ["id", "user_id", "report_id", "intake_id", "payment_intent_id", "title", "entity", "platform", "scan_mode", "target", "risk_score", "confidence_score", "stage", "source", "top_factors", "risk_engine_version", "provider_versions", "provider_results", "evidence_snapshot", "report_version", "score_explanation", "payment_status", "report_status", "metadata", "created_at", "ready_at"],
  payment_intents: ["id", "user_id", "provider", "provider_reference", "plan_name", "amount_cents", "currency", "method", "status", "metadata", "created_at", "updated_at"],
  legal_acceptances: ["id", "user_id", "payment_intent_id", "report_id", "legal_version", "terms_version", "privacy_version", "source", "accepted_at", "ip_address", "user_agent", "metadata"],
  watchlist_entries: ["id", "user_id", "name", "type", "status", "last_score", "metadata", "created_at", "updated_at"],
};

for (const [table, columns] of Object.entries(required)) {
  const definition = sql.match(new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, "iu"));
  assert.ok(definition, `${table} must be created by ${migrationName}`);
  for (const column of columns) {
    assert.match(definition[1], new RegExp(`^\\s*${column}\\s`, "imu"), `${table}.${column} is missing`);
  }
  assert.match(sql, new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "iu"), `${table} must enable RLS`);
  assert.match(sql, new RegExp(`\\('${table}',\\s*'purchase_flow_own_[^']+',\\s*'(?:id|user_id)'\\)`, "u"), `${table} must have an owner policy`);
}

assert.doesNotMatch(sql, /\b(?:drop\s+table|truncate|delete\s+from|update\s+public\.|insert\s+into)\b/iu, "baseline migration must not remove or rewrite production data");
assert.doesNotMatch(sql, /collector_executions/iu, "baseline migration must exclude collector_executions");
assert.match(sql, /notify\s+pgrst,\s*'reload schema'/iu, "migration must reload the PostgREST schema cache");

console.log(`Validated ${Object.keys(required).length} purchase-flow tables, required columns, RLS owner policies, and non-destructive SQL in ${migrationName}.`);

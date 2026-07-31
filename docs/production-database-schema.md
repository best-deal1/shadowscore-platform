# Production database schema audit

Audit date: 2026-07-31

## Finding

`public.intakes` is a required application table. It is created by
`20260704010000_v22_report_pipeline.sql`. That migration depends on
`20260704000000_v19_auth_workspace_foundation.sql`, which creates the referenced
workspace tables and enables `pgcrypto`.

The production error `Could not find the table 'public.intakes' in the schema
cache` is consistent with the report pipeline migration being absent from the
connected Supabase project. This repository has no linked Supabase project,
database connection string, Supabase CLI installation, or migration ledger
export. The production migration state therefore cannot be verified from this
checkout alone.

## Required tables

The complete schema represented by the checked-in migration chain contains the
following tables. Apply migrations in filename order.

| Migration | Tables created |
| --- | --- |
| `20260704000000_v19_auth_workspace_foundation.sql` | `profiles`, `reports`, `watchlist_entries`, `payment_intents`, `legal_acceptances` |
| `20260704010000_v22_report_pipeline.sql` | `intakes` |
| `20260724000000_m1_case_data_layer.sql` | `organizations`, `organization_memberships`, `cases` |
| `20260724010000_pr4_activity_timeline.sql` | `timeline_events` |
| `20260724020000_findings_workspace.sql` | `evidence_items`, `findings`, `finding_evidence` |
| `20260724030000_decision_workspace.sql` | `decisions`, `decision_findings`, `decision_versions` |
| `20260725000000_secure_case_tenant_boundaries.sql` | No tables. Adds tenant policies. |
| `20260725010000_website_intelligence_history.sql` | `website_intelligence_scans` |
| `20260726010000_website_watchlists_and_alerts.sql` | `website_watchlist`, `website_alerts` |
| `20260726020000_product_entitlements.sql` | `product_catalog`, `workspace_subscriptions`, `entitlement_grants`, `guest_report_purchases` |
| `20260726030000_platform_core_phase_1.sql` | `subjects`, `subject_identifiers`, `investigation_jobs`, `investigation_stages`, `evidence_observations`, `provider_result_cache`, `provider_usage_events`, `platform_audit_events` |
| `20260726040000_platform_core_phase_2_wave_1.sql` | `platform_registry_entries`, `pricing_policies`, `pricing_policy_rules`, `collector_executions`, `cost_ledger_entries`, `workspace_usage_events`, `subscription_plans`, `plan_entitlements` |
| `20260726050000_evidence_platform_wave_2.sql` | `evidence_providers`, `evidence_sources`, `evidence_source_instances`, `evidence_v`, `evidence_normalization_runs`, `evidence_assertions`, `assertion_observation_links`, `evidence_links`, `evidence_quarantine`, `current_evidence_projection`, `evidence_outbox` |
| `20260726060000_collector_runtime_wave_3.sql` | `collector_registry`, `collector_executions`, `execution_attempts`, `execution_events` |
| `20260726070000_knowledge_layer_wave_4.sql` | `resolution_policies`, `identity_candidates`, `resolved_facts`, `knowledge_conflicts`, `relationships`, `fact_assertions`, `relationship_assertions`, `identity_candidate_assertions`, `conflict_assertions`, `knowledge_projection`, `knowledge_graph_nodes`, `knowledge_graph_edges`, `knowledge_resolution_runs`, `knowledge_events` |
| `20260726080000_entity_intelligence_wave_5.sql` | `entity_observations`, `canonical_entities`, `entity_observation_links`, `entity_resolution_decisions`, `entity_resolution_reviews`, `entity_relationships` |
| `20260726090000_trust_intelligence_wave_6.sql` | `trust_policies`, `trust_signals`, `trust_snapshots`, `trust_alerts` |
| `20260728010000_pr5_payment_report_unlock.sql` | No tables. Adds payment and report indexes. |
| `20260728020000_pr7_continuous_monitoring.sql` | `monitored_entities`, `monitoring_snapshots`, `monitoring_alerts`, `notification_events` |
| `20260728030000_pr8_provider_orchestration.sql` | `collector_pipeline_runs`, `provider_health`, `collector_cache`, `pipeline_audit_events` |

## Migration chain issue

The complete chain is not currently safe to apply unchanged to an empty
database. `public.collector_executions` is created twice:

1. `20260726040000_platform_core_phase_2_wave_1.sql` defines the pricing and
   cost version of the table.
2. `20260726060000_collector_runtime_wave_3.sql` creates a different runtime
   version without `if not exists`.

The second statement will fail when migrations are applied in order. Changing
it to `if not exists` would also be incorrect because later statements require
runtime columns and constraints that the first definition does not contain.
Resolve these definitions in a forward migration or a reviewed baseline before
deploying the complete chain.

## Deployment plan

1. Confirm that the production application and the migration command target the
   same Supabase project. Record the project reference without storing secrets in
   the repository.
2. Export `supabase_migrations.schema_migrations` from production. Compare its
   versions with every filename in `supabase/migrations`.
3. Take a production database backup. Test restoration before making schema
   changes.
4. For the current intake outage, apply
   `20260704000000_v19_auth_workspace_foundation.sql` and then
   `20260704010000_v22_report_pipeline.sql` if their ledger entries and objects
   are absent. Use the normal Supabase migration mechanism so both versions are
   recorded. Do not paste only the `create table` statement into production.
5. Verify `public.intakes`, its row-level security setting, and the policy named
   `Users can manage own intakes`. Ask PostgREST to reload its schema only if the
   table exists but remains absent from the API schema cache.
6. Run an authenticated smoke test that creates, reads, updates, and removes a
   disposable intake owned by the test user.
7. Reconcile the two `collector_executions` models. Validate a clean migration
   run against a disposable Supabase database before applying migrations after
   `20260726030000_platform_core_phase_1.sql` to production.
8. Apply the remaining reviewed migrations in filename order. After each batch,
   compare the migration ledger and table inventory with this document.

## Verification queries

Run these through a trusted database connection. The queries expose metadata,
not customer records.

```sql
select version
from supabase_migrations.schema_migrations
order by version;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

select c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'intakes';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'intakes';
```

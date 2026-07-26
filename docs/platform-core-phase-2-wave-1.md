# Platform Core Phase 2, Wave 1

## Architecture changes

Wave 1 adds a data-driven registry, immutable pricing references, collector execution attribution, an append-only cost ledger, a workspace usage ledger, and generic plan entitlements. Subjects and identifiers continue to use the Phase 1 tables. Registry entries describe supported types without changing subject resolution behavior.

The commercial accounting flow is:

`collector execution -> priced cost ledger entry -> workspace usage event -> entitlement evaluation -> billing integration`

Pricing and billing remain separate. A pricing rule calculates a cost for a unit. A cost ledger entry records estimated, actual, billable, and internal platform amounts. Billing providers can consume billable amounts later without becoming the source of cost truth.

## Database migration

Migration `20260726040000_platform_core_phase_2_wave_1.sql` adds:

- `platform_registry_entries`
- `pricing_policies` and `pricing_policy_rules`
- `collector_executions` and `cost_ledger_entries`
- `workspace_usage_events` and `workspace_monthly_usage`
- `subscription_plans` and `plan_entitlements`
- Optional links from the existing product and provider usage tables

All ledger writes are reserved for the service role. Workspace members receive read access through row-level security.

## API changes

`GET /api/workspace/usage` returns the authenticated workspace's current monthly investigation, monitoring, AI, provider spend, and storage totals. Existing APIs and response contracts are unchanged.

## Backward compatibility

- Website Intelligence remains the only production collector.
- Existing subjects, identifiers, investigations, evidence, usage events, products, grants, and subscriptions are retained.
- Existing provider cost columns remain available. New linkage and cost columns are nullable for historical rows.
- The migration adds no collector runtime, Evidence V2, relationship ledger, Trust Graph, or intelligence module.
- Existing product grants can be mapped to plans incrementally through the nullable `product_catalog.plan_version_id` column.

## Billing and pricing models

Pricing policies have stable keys, increasing versions, effective time ranges, and ISO currency codes. Rules select a cost source and billing unit, with optional provider and collector specificity. Prices are stored as data. Application code contains no provider prices.

Each collector execution has a stable execution ID and belongs to an investigation and workspace. Its cost entries carry the provider, policy ID and version, source, unit, quantity, currency, and all four required cost views. Multiple entries support compound costs such as provider, AI, storage, and internal execution charges.

## Usage accounting and entitlements

Usage events use registry-backed metric keys, quantities, units, idempotency keys, and optional investigation, execution, and cost references. The monthly view exposes current totals. Plan entitlements store arbitrary feature keys, enablement, limits, units, and configuration. Free, Pro, Enterprise, and later plans can therefore be introduced as records.

## Rollback plan

1. Stop writes to `workspace_usage_events`, `cost_ledger_entries`, and `collector_executions`.
2. Revert callers to the existing `provider_usage_events` path.
3. Drop the `workspace_monthly_usage` view and the optional columns added to legacy tables.
4. Drop Wave 1 tables in reverse foreign-key order: plan entitlements, usage events, cost entries, executions, pricing rules, pricing policies, plans, and registry entries.

The rollback does not modify Phase 1 subjects, investigations, Website Intelligence history, existing product grants, or existing provider usage data.

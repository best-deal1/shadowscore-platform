# Product architecture

ShadowScore has two product modes. Instant Report is a one-time snapshot and acquisition path. Continuous Monitoring is the workspace product for watchlists, alerts, history, dashboards, and recurring reports.

## Boundaries

- `lib/products/catalog.ts` defines stable product IDs, billing models, features, and usage limits. It contains no prices or payment-provider IDs.
- `lib/products/entitlements.ts` is the access decision point. Product features call `checkEntitlement` or `requireEntitlement` with a report or workspace scope.
- `lib/products/guestReports.ts` issues opaque download and claim tokens. Only hashes of claim tokens are stored. A successful claim creates an Instant Report grant scoped to the purchased report.
- `lib/products/subscriptions.ts` defines the provider-neutral workspace subscription contract. A billing adapter can populate it later.
- Existing Website Intelligence reports and monitoring data stay unchanged. The new tables add access metadata around those resources.

## Data model

`product_catalog` stores product definitions and limits. `workspace_subscriptions` connects a monitoring product to an organization. `entitlement_grants` records active access for one report or workspace. `guest_report_purchases` holds temporary guest ownership and claim state.

Monitoring access belongs to `organizations`, which are the existing workspace boundary. An Instant Report grant belongs to one report. Payment state is a source of grants, not an authorization rule.

## Migration plan

1. Apply `20260726020000_product_entitlements.sql`. This creates the new tables and seeds the price-free catalog.
2. Backfill one workspace grant for each current monitoring customer. Map the legacy plan name to a stable product ID during this one-time operation.
3. Backfill report grants for completed one-time purchases. Keep legacy payment records for audit history.
4. Route watchlist, alert, history, dashboard, report, and export authorization through the entitlement service. Roll out one feature at a time and compare decisions with current access logs.
5. Add a billing-provider adapter that writes subscription state and grants in one server-side transaction. Product code continues to read entitlements only.
6. Remove legacy plan-name and payment-status gates after the decision logs show full coverage.

Guest purchase creation, token delivery, PDF generation, and billing webhooks remain server responsibilities. They should use service credentials and must not expose claim-token hashes to browsers.

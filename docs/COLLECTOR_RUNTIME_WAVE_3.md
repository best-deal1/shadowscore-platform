# Collector Runtime, Wave 3

## Architecture

The planner selects registered collectors from subject, identifier, capability, and entitlement metadata. The runtime owns leases, attempts, retries, timeouts, cancellation, metrics, costs, and audit history. Collectors receive immutable execution context through dependency injection. They validate input and return observations.

Adding a collector requires an implementation of `Collector` and registry registration. Planner and runtime code do not change. Dependencies are collector keys, so execution plans remain data driven as the catalog grows beyond 100 collectors.

## Website Intelligence compatibility

`WebsiteCollector` calls the existing Website Intelligence scan entry point and maps its evidence to observations. The existing report and Evidence V2 paths remain unchanged and authoritative. The adapter adds no findings, assertions, report writes, or direct database access.

## Rollback

1. Stop workers that claim collector executions.
2. Route Website Intelligence jobs through the existing investigation worker.
3. Keep execution history for audit purposes. It is isolated from legacy report and evidence tables.
4. Remove the three runtime API routes if runtime status should no longer be exposed.
5. Drop the Wave 3 tables only after exporting execution history and confirming that no runtime workers remain.

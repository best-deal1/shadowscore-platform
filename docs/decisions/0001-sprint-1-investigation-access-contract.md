# Sprint 1 Investigation and Access Contract

**Status:** Accepted

**Scope:** Sprint 1, Task 1

## Decision

`public.intakes.intake_id` is the canonical Investigation identifier for Sprint 1. API parameters and customer references call this value `investigationId`. List, detail, and report lookup use the same value. New reports store it in `reports.investigation_id`. The existing `reports.intake_id` column remains a compatibility alias during Sprint 1.

An Investigation has one direct owner in `intakes.user_id`. It may also belong to one organization in `intakes.organization_id`. A customer can read it when either condition is true:

1. `auth.uid()` equals the direct owner.
2. The customer has an active `organization_memberships` row for the Investigation organization.

Organization roles do not change read access in this sprint. Disabled and missing memberships grant no access. Changing an ownership or membership row takes effect on the next database request because authorization is evaluated by row-level security.

Staff report access requires `profiles.role = 'admin'`. The database role is authoritative. A staff read does not change customer ownership. Task 7 must require a purpose and write the existing immutable `admin_report_audit` event when a report is opened. Customer access and staff access are separate policies.

## Minimum read projections

The migration creates three `security_invoker` views. Their base-table row-level security policies remain in force.

| Projection | Purpose | Fields |
| --- | --- | --- |
| `investigation_list_projection` | Customer list and Archive inputs | Investigation ID, owner, organization, target, platform, scan mode, payment status, report status, created time, updated time |
| `investigation_detail_projection` | One Investigation header and status | List fields plus case type |
| `investigation_report_projection` | Focused report lookup | Investigation ID, report ID, owner, organization, report status, payment status, created time, ready time |

These are boundary projections, not complete UI payloads. Tasks 3 and 7 may add server composition behind them. They must not widen tenant access or introduce another Investigation identifier.

## Forward migration

1. Apply migrations through `20260801010000_sprint_1_investigation_contract.sql` in a non-production Supabase project.
2. The migration adds nullable ownership and compatibility columns. It backfills `reports.investigation_id` from `reports.intake_id` and installs a synchronization trigger.
3. Query for exceptions using the checks below. Assign an owner or organization to each valid Investigation. Resolve missing and mismatched report links.
4. Exercise owner, active-member, disabled-member, cross-tenant, Admin, and normal-user reads with separate authenticated JWTs.
5. Apply the migration in production. Monitor the exception queries and denied-request logs.
6. After the exception queue is empty, validate `reports_investigation_id_fkey`. A later task may make `reports.investigation_id` required. That tightening is outside Task 1.

```sql
select intake_id from public.intakes where user_id is null and organization_id is null;
select report_id from public.reports where investigation_id is null;
select r.report_id from public.reports r left join public.intakes i on i.intake_id = r.investigation_id where r.investigation_id is not null and i.intake_id is null;
select report_id from public.reports where intake_id is distinct from investigation_id;
```

## Legacy-record exceptions

Existing `intakes.user_id` values remain direct owners. Existing reports with an `intake_id` receive that value as `investigation_id`. A report with no Investigation link stays unavailable through the report projection and enters the reconciliation queue. An orphan or mismatched link is not guessed from email, target, report metadata, or timestamps. Operations must map it to a verified Investigation or quarantine it for review.

Records without an organization remain user-owned. Records must not receive an organization based only on the owner's current membership. This avoids silently exposing a personal record to other organization members.

## Rollback

Rollback removes only the new views, policies, trigger, function, indexes, foreign key, and columns. Take a database backup first. Do not drop `reports.investigation_id` until any writes made after deployment have been copied to `reports.intake_id` and verified.

```sql
begin;
drop view if exists public.investigation_report_projection, public.investigation_detail_projection, public.investigation_list_projection;
drop policy if exists sprint_1_staff_read_reports on public.reports;
drop policy if exists sprint_1_staff_read_intakes on public.intakes;
drop policy if exists sprint_1_customer_read_reports on public.reports;
drop policy if exists sprint_1_customer_read_intakes on public.intakes;
drop trigger if exists reports_sync_investigation_id on public.reports;
drop function if exists public.sync_report_investigation_id();
drop index if exists public.reports_investigation_id_created_at_idx;
drop index if exists public.intakes_organization_created_at_idx;
alter table public.reports drop constraint if exists reports_investigation_id_fkey;
alter table public.reports drop column if exists investigation_id;
alter table public.intakes drop column if exists organization_id;
commit;
notify pgrst, 'reload schema';
```

## Deferred decisions

Payment behavior, Comp behavior, impersonation, archive semantics, the complete Investigation lifecycle, report content, and UI changes remain outside Task 1.

-- Sprint 1 Investigation identity and read-access contract.
-- The public intakes.intake_id value is the canonical Investigation ID.
begin;

alter table public.intakes
  add column if not exists organization_id uuid references public.organizations(id) on delete restrict;

alter table public.reports
  add column if not exists investigation_id text;

update public.reports
set investigation_id = intake_id
where investigation_id is null and intake_id is not null;

create or replace function public.sync_report_investigation_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.investigation_id is null then
    new.investigation_id := new.intake_id;
  elsif new.intake_id is null then
    new.intake_id := new.investigation_id;
  elsif new.investigation_id <> new.intake_id then
    raise exception 'report investigation_id and intake_id must match';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_sync_investigation_id on public.reports;
create trigger reports_sync_investigation_id
before insert or update of investigation_id, intake_id on public.reports
for each row execute function public.sync_report_investigation_id();

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reports_investigation_id_fkey'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_investigation_id_fkey
      foreign key (investigation_id) references public.intakes(intake_id)
      on delete restrict not valid;
  end if;
end
$constraints$;

create index if not exists intakes_organization_created_at_idx
  on public.intakes (organization_id, created_at desc)
  where organization_id is not null;
create index if not exists reports_investigation_id_created_at_idx
  on public.reports (investigation_id, created_at desc)
  where investigation_id is not null;

drop policy if exists sprint_1_customer_read_intakes on public.intakes;
create policy sprint_1_customer_read_intakes on public.intakes
for select to authenticated
using (
  auth.uid() = intakes.user_id
  or exists (
    select 1 from public.organization_memberships m
    where m.organization_id = intakes.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists sprint_1_customer_read_reports on public.reports;
create policy sprint_1_customer_read_reports on public.reports
for select to authenticated
using (
  exists (
    select 1 from public.intakes i
    where i.intake_id = reports.investigation_id
      and (
        auth.uid() = i.user_id
        or exists (
          select 1 from public.organization_memberships m
          where m.organization_id = i.organization_id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
      )
  )
);

drop policy if exists sprint_1_staff_read_intakes on public.intakes;
create policy sprint_1_staff_read_intakes on public.intakes
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists sprint_1_staff_read_reports on public.reports;
create policy sprint_1_staff_read_reports on public.reports
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace view public.investigation_list_projection
with (security_invoker = true)
as
select
  i.intake_id as investigation_id,
  i.user_id as owner_user_id,
  i.organization_id,
  i.target,
  i.platform,
  i.scan_mode,
  i.payment_status,
  i.report_status,
  i.created_at,
  i.updated_at
from public.intakes i;

create or replace view public.investigation_detail_projection
with (security_invoker = true)
as
select
  i.intake_id as investigation_id,
  i.user_id as owner_user_id,
  i.organization_id,
  i.target,
  i.platform,
  i.scan_mode,
  i.case_type,
  i.payment_status,
  i.report_status,
  i.created_at,
  i.updated_at
from public.intakes i;

create or replace view public.investigation_report_projection
with (security_invoker = true)
as
select
  r.investigation_id,
  r.report_id,
  i.user_id as owner_user_id,
  i.organization_id,
  r.report_status,
  r.payment_status,
  r.created_at,
  r.ready_at
from public.reports r
join public.intakes i on i.intake_id = r.investigation_id;

revoke all on public.investigation_list_projection,
  public.investigation_detail_projection,
  public.investigation_report_projection from public, anon;
grant select on public.investigation_list_projection,
  public.investigation_detail_projection,
  public.investigation_report_projection to authenticated;

commit;
notify pgrst, 'reload schema';

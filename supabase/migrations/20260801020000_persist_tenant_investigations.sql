-- Sprint 1 Task 3: enforce tenant-safe writes for canonical Investigations.
-- Forward: install the validation trigger below. Existing rows are not rewritten.
-- Rollback: drop trigger intakes_validate_canonical_owner on public.intakes;
--           drop function public.validate_canonical_intake_owner();
-- Reconcile before and after deployment:
-- select i.intake_id, i.user_id, i.organization_id
-- from public.intakes i
-- where i.organization_id is not null
--   and not exists (
--     select 1 from public.organization_memberships m
--     where m.organization_id = i.organization_id
--       and m.user_id = i.user_id and m.status = 'active'
--   );
-- select r.report_id, r.intake_id, r.investigation_id
-- from public.reports r
-- where r.intake_id is distinct from r.investigation_id;

begin;

create or replace function public.validate_canonical_intake_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'intake owner must be the authenticated user';
  end if;

  if new.organization_id is not null and auth.uid() is not null and not exists (
    select 1 from public.organization_memberships m
    where m.organization_id = new.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  ) then
    raise exception 'intake organization requires active membership';
  end if;

  return new;
end;
$$;

drop trigger if exists intakes_validate_canonical_owner on public.intakes;
create trigger intakes_validate_canonical_owner
before insert or update of user_id, organization_id on public.intakes
for each row execute function public.validate_canonical_intake_owner();

commit;
notify pgrst, 'reload schema';

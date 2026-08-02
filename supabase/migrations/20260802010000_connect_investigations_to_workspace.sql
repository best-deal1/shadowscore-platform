-- Connect canonical Investigations to the organization workspace queue.
-- Earlier intake writes did not set organization_id or create a case, so the
-- authenticated queue correctly returned zero rows even when intakes existed.

begin;

create unique index if not exists cases_organization_investigation_id_idx
on public.cases (organization_id, investigation_id);

create or replace function public.assign_intake_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    select membership.organization_id
    into new.organization_id
    from public.organization_memberships membership
    where membership.user_id = new.user_id
      and membership.status = 'active'
    order by membership.updated_at desc, membership.created_at desc
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists intakes_assign_workspace on public.intakes;
create trigger intakes_assign_workspace
before insert or update of user_id, organization_id on public.intakes
for each row execute function public.assign_intake_workspace();

create or replace function public.ensure_intake_workspace_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is not null then
    insert into public.cases (
      organization_id,
      investigation_id,
      title,
      status,
      priority,
      owner_id,
      created_at,
      updated_at
    )
    values (
      new.organization_id,
      new.intake_id,
      new.target,
      'draft',
      'normal',
      new.user_id,
      new.created_at,
      new.updated_at
    )
    on conflict (organization_id, investigation_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists intakes_ensure_workspace_case on public.intakes;
create trigger intakes_ensure_workspace_case
after insert or update of organization_id on public.intakes
for each row execute function public.ensure_intake_workspace_case();

-- Attach saved investigations to the owner's active workspace. The ordering
-- matches the membership selected by the application actor resolver.
with preferred_membership as (
  select distinct on (membership.user_id)
    membership.user_id,
    membership.organization_id
  from public.organization_memberships membership
  where membership.status = 'active'
  order by membership.user_id, membership.updated_at desc, membership.created_at desc
)
update public.intakes intake
set organization_id = preferred_membership.organization_id,
    updated_at = greatest(intake.updated_at, now())
from preferred_membership
where intake.user_id = preferred_membership.user_id
  and intake.organization_id is null;

-- Cover rows that already had an organization before this migration. Rows
-- updated above are handled by the trigger and ignored by this idempotent insert.
insert into public.cases (
  organization_id,
  investigation_id,
  title,
  status,
  priority,
  owner_id,
  created_at,
  updated_at
)
select
  intake.organization_id,
  intake.intake_id,
  intake.target,
  'draft',
  'normal',
  intake.user_id,
  intake.created_at,
  intake.updated_at
from public.intakes intake
where intake.organization_id is not null
on conflict (organization_id, investigation_id) do nothing;

commit;
notify pgrst, 'reload schema';

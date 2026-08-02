-- Bootstrap the production workspace and Investigation schema from a partially
-- migrated purchase-flow database. This migration intentionally repeats the
-- final definitions of the five foundational relations so it can be applied
-- without replaying their historical migrations.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles profile
set email = coalesce(auth_user.email, '')
from auth.users auth_user
where profile.id = auth_user.id
  and profile.email is null;

do $bootstrap_profiles$
begin
  if exists (select 1 from public.profiles where email is null) then
    raise exception 'Cannot bootstrap profiles: email contains null values';
  end if;
end
$bootstrap_profiles$;

alter table public.profiles alter column email set not null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin'));

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations add column if not exists name text;
alter table public.organizations add column if not exists created_at timestamptz not null default now();
alter table public.organizations add column if not exists updated_at timestamptz not null default now();

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_memberships add column if not exists organization_id uuid;
alter table public.organization_memberships add column if not exists user_id uuid;
alter table public.organization_memberships add column if not exists role text;
alter table public.organization_memberships add column if not exists status text not null default 'active';
alter table public.organization_memberships add column if not exists created_at timestamptz not null default now();
alter table public.organization_memberships add column if not exists updated_at timestamptz not null default now();

do $bootstrap_membership_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_memberships'::regclass
      and contype = 'p'
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_pkey primary key (organization_id, user_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_memberships'::regclass
      and conname = 'organization_memberships_organization_id_fkey'
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_memberships'::regclass
      and conname = 'organization_memberships_user_id_fkey'
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end
$bootstrap_membership_constraints$;

alter table public.organization_memberships drop constraint if exists organization_memberships_role_check;
alter table public.organization_memberships add constraint organization_memberships_role_check
  check (role in ('owner', 'manager', 'analyst', 'viewer'));
alter table public.organization_memberships drop constraint if exists organization_memberships_status_check;
alter table public.organization_memberships add constraint organization_memberships_status_check
  check (status in ('active', 'disabled'));

create table if not exists public.intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_id text not null unique,
  organization_id uuid references public.organizations(id) on delete restrict,
  scan_mode text not null,
  target text not null,
  platform text not null,
  case_type text,
  email text not null,
  file_names jsonb not null default '[]'::jsonb,
  visible_signal_categories jsonb not null default '[]'::jsonb,
  payment_status text not null default 'payment_pending',
  report_status text not null default 'preview',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- These guards repair tables created by the older report-pipeline migration.
alter table public.intakes add column if not exists organization_id uuid;
alter table public.intakes add column if not exists case_type text;
alter table public.intakes add column if not exists file_names jsonb not null default '[]'::jsonb;
alter table public.intakes add column if not exists visible_signal_categories jsonb not null default '[]'::jsonb;
alter table public.intakes add column if not exists payment_status text not null default 'payment_pending';
alter table public.intakes add column if not exists report_status text not null default 'preview';
alter table public.intakes add column if not exists created_at timestamptz not null default now();
alter table public.intakes add column if not exists updated_at timestamptz not null default now();

do $bootstrap_intake_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.intakes'::regclass
      and conname = 'intakes_organization_id_fkey'
  ) then
    alter table public.intakes
      add constraint intakes_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete restrict;
  end if;
end
$bootstrap_intake_constraints$;

alter table public.intakes drop constraint if exists intakes_scan_mode_check;
alter table public.intakes add constraint intakes_scan_mode_check
  check (scan_mode in ('website', 'marketplace', 'evidence'));
alter table public.intakes drop constraint if exists intakes_payment_status_check;
alter table public.intakes add constraint intakes_payment_status_check
  check (payment_status in ('payment_pending', 'processing', 'paid', 'admin_comped', 'failed', 'refunded'));
alter table public.intakes drop constraint if exists intakes_report_status_check;
alter table public.intakes add constraint intakes_report_status_check
  check (report_status in ('preview', 'payment_pending', 'generating', 'ready', 'failed'));

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  investigation_id text not null,
  title text not null,
  status text not null default 'draft',
  priority text not null default 'normal',
  owner_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases add column if not exists public_id text default encode(gen_random_bytes(12), 'hex');
alter table public.cases add column if not exists organization_id uuid;
alter table public.cases add column if not exists investigation_id text;
alter table public.cases add column if not exists title text;
alter table public.cases add column if not exists status text not null default 'draft';
alter table public.cases add column if not exists priority text not null default 'normal';
alter table public.cases add column if not exists owner_id uuid;
alter table public.cases add column if not exists due_at timestamptz;
alter table public.cases add column if not exists version integer not null default 1;
alter table public.cases add column if not exists created_at timestamptz not null default now();
alter table public.cases add column if not exists updated_at timestamptz not null default now();

do $bootstrap_case_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cases'::regclass
      and conname = 'cases_organization_id_fkey'
  ) then
    alter table public.cases
      add constraint cases_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cases'::regclass
      and conname = 'cases_owner_id_fkey'
  ) then
    alter table public.cases
      add constraint cases_owner_id_fkey
      foreign key (owner_id) references public.profiles(id) on delete set null;
  end if;
end
$bootstrap_case_constraints$;

alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check check (
  status in ('draft', 'active', 'awaiting_input', 'under_review', 'monitoring', 'closed', 'archived')
);
alter table public.cases drop constraint if exists cases_priority_check;
alter table public.cases add constraint cases_priority_check
  check (priority in ('low', 'normal', 'high', 'critical'));

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);
create index if not exists organization_memberships_user_status_updated_at_idx
  on public.organization_memberships (user_id, status, updated_at desc);
create index if not exists organization_memberships_organization_status_idx
  on public.organization_memberships (organization_id, status);
create index if not exists intakes_user_created_at_idx
  on public.intakes (user_id, created_at desc);
create index if not exists intakes_organization_created_at_idx
  on public.intakes (organization_id, created_at desc)
  where organization_id is not null;
create index if not exists cases_organization_updated_at_idx
  on public.cases (organization_id, updated_at desc);
create index if not exists cases_organization_public_id_idx
  on public.cases (organization_id, public_id);
create unique index if not exists cases_organization_investigation_id_idx
  on public.cases (organization_id, investigation_id);

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.role is distinct from new.role and auth.uid() is not null then
    raise exception 'Profile roles can only be changed by a database administrator';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_case_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status = 'active')
    or (old.status = 'active' and new.status in ('awaiting_input', 'under_review'))
    or (old.status = 'awaiting_input' and new.status = 'active')
    or (old.status = 'under_review' and new.status in ('monitoring', 'closed'))
    or (old.status = 'monitoring' and new.status in ('closed', 'archived'))
    or (old.status = 'closed' and new.status = 'archived')
  ) then
    raise exception 'Invalid case status transition from % to %', old.status, new.status;
  end if;

  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

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
    select 1 from public.organization_memberships membership
    where membership.organization_id = new.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  ) then
    raise exception 'intake organization requires active membership';
  end if;

  return new;
end;
$$;

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

create or replace function public.ensure_intake_workspace_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is not null then
    insert into public.cases (
      organization_id, investigation_id, title, status, priority, owner_id,
      created_at, updated_at
    ) values (
      new.organization_id, new.intake_id, new.target, 'draft', 'normal',
      new.user_id, new.created_at, new.updated_at
    )
    on conflict (organization_id, investigation_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.provision_customer_workspace(
  customer_id uuid,
  customer_email text,
  customer_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  workspace_id uuid;
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(customer_metadata ->> 'full_name'), ''),
    nullif(trim(customer_metadata ->> 'name'), ''),
    nullif(split_part(coalesce(customer_email, ''), '@', 1), ''),
    'Customer'
  );

  insert into public.profiles (id, email, full_name)
  values (customer_id, coalesce(customer_email, ''), display_name)
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  select organization_id into workspace_id
  from public.organization_memberships
  where user_id = customer_id
  order by updated_at desc
  limit 1;

  if workspace_id is null then
    insert into public.organizations (name)
    values (display_name || ' workspace')
    returning id into workspace_id;

    insert into public.organization_memberships (organization_id, user_id, role, status)
    values (workspace_id, customer_id, 'owner', 'active');
  end if;
end;
$$;

revoke all on function public.provision_customer_workspace(uuid, text, jsonb) from public;

create or replace function public.provision_customer_workspace_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.provision_customer_workspace(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_role_change on public.profiles;
create trigger profiles_prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

drop trigger if exists cases_workflow_before_update on public.cases;
create trigger cases_workflow_before_update
before update on public.cases
for each row execute function public.enforce_case_workflow();

drop trigger if exists intakes_assign_workspace on public.intakes;
create trigger intakes_assign_workspace
before insert or update of user_id, organization_id on public.intakes
for each row execute function public.assign_intake_workspace();

drop trigger if exists intakes_validate_canonical_owner on public.intakes;
create trigger intakes_validate_canonical_owner
before insert or update of user_id, organization_id on public.intakes
for each row execute function public.validate_canonical_intake_owner();

drop trigger if exists intakes_ensure_workspace_case on public.intakes;
create trigger intakes_ensure_workspace_case
after insert or update of organization_id on public.intakes
for each row execute function public.ensure_intake_workspace_case();

drop trigger if exists auth_user_provision_customer_workspace on auth.users;
create trigger auth_user_provision_customer_workspace
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.provision_customer_workspace_from_auth_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.intakes enable row level security;
alter table public.cases enable row level security;

drop policy if exists purchase_flow_own_profile on public.profiles;
create policy purchase_flow_own_profile on public.profiles
for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Members read their organizations" on public.organizations;
create policy "Members read their organizations" on public.organizations
for select to authenticated using (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

drop policy if exists "Users read their memberships" on public.organization_memberships;
create policy "Users read their memberships" on public.organization_memberships
for select to authenticated using (user_id = auth.uid());

drop policy if exists purchase_flow_own_intakes on public.intakes;
create policy purchase_flow_own_intakes on public.intakes
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists sprint_1_customer_read_intakes on public.intakes;
create policy sprint_1_customer_read_intakes on public.intakes
for select to authenticated using (
  auth.uid() = intakes.user_id
  or exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = intakes.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

drop policy if exists sprint_1_staff_read_intakes on public.intakes;
create policy sprint_1_staff_read_intakes on public.intakes
for select to authenticated using (
  exists (select 1 from public.profiles profile where profile.id = auth.uid() and profile.role = 'admin')
);

drop policy if exists "Active members read organization cases" on public.cases;
create policy "Active members read organization cases" on public.cases
for select to authenticated using (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

drop policy if exists "Workspace editors create organization cases" on public.cases;
create policy "Workspace editors create organization cases" on public.cases
for insert to authenticated with check (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
);

drop policy if exists "Workspace editors update organization cases" on public.cases;
create policy "Workspace editors update organization cases" on public.cases
for update to authenticated using (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
) with check (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
);

grant select, insert, update, delete on public.profiles, public.intakes to authenticated;
grant select on public.organizations, public.organization_memberships to authenticated;
grant select, insert, update on public.cases to authenticated;

-- Provision workspaces before linking existing Investigations. The function is
-- idempotent and reuses the most recently updated membership for each user.
do $bootstrap_users$
declare
  existing_user auth.users%rowtype;
begin
  for existing_user in select * from auth.users loop
    perform public.provision_customer_workspace(
      existing_user.id,
      existing_user.email,
      existing_user.raw_user_meta_data
    );
  end loop;
end
$bootstrap_users$;

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

insert into public.cases (
  organization_id, investigation_id, title, status, priority, owner_id,
  created_at, updated_at
)
select
  intake.organization_id, intake.intake_id, intake.target, 'draft', 'normal',
  intake.user_id, intake.created_at, intake.updated_at
from public.intakes intake
where intake.organization_id is not null
on conflict (organization_id, investigation_id) do nothing;

commit;

notify pgrst, 'reload schema';

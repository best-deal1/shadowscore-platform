-- Install the workspace relations required by customer workspace provisioning.
-- The guards keep this migration safe for databases that already have them.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'analyst', 'viewer')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_memberships_user_status_updated_at_idx
on public.organization_memberships (user_id, status, updated_at desc);

create index if not exists organization_memberships_organization_status_idx
on public.organization_memberships (organization_id, status);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'Members read their organizations'
  ) then
    create policy "Members read their organizations"
    on public.organizations
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.organization_memberships membership
        where membership.organization_id = organizations.id
          and membership.user_id = auth.uid()
          and membership.status = 'active'
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_memberships'
      and policyname = 'Users read their memberships'
  ) then
    create policy "Users read their memberships"
    on public.organization_memberships
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;
end;
$$;

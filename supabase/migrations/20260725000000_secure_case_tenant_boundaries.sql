-- The workspace actor resolver reads memberships through PostgREST, so the
-- membership relation must only expose rows owned by the authenticated user.
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.cases enable row level security;

create policy "Members read their organizations"
on public.organizations
for select
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "Users read their memberships"
on public.organization_memberships
for select
using (user_id = auth.uid());

create policy "Active members read organization cases"
on public.cases
for select
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "Workspace editors create organization cases"
on public.cases
for insert
with check (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
);

create policy "Workspace editors update organization cases"
on public.cases
for update
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
)
with check (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
);

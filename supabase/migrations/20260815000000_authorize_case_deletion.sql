grant delete on public.cases to authenticated;

create policy "Workspace editors delete organization cases"
on public.cases
for delete
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = cases.organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  )
);

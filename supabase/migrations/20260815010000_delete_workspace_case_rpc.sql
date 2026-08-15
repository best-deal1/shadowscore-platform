create or replace function public.delete_workspace_case(
  p_public_id text,
  p_organization_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user_id uuid := auth.uid();
  deleted_case_id uuid;
begin
  if requesting_user_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = requesting_user_id
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'analyst')
  ) then
    return false;
  end if;

  delete from public.cases
  where public_id = p_public_id
    and organization_id = p_organization_id
  returning id into deleted_case_id;

  return deleted_case_id is not null;
end;
$$;

revoke all on function public.delete_workspace_case(text, uuid) from public;
grant execute on function public.delete_workspace_case(text, uuid) to authenticated;

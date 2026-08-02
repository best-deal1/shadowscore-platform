-- Connect every authenticated customer to the tenant-scoped workspace routes.
-- Existing users are backfilled, and future users are provisioned at signup.

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

  select organization_id
  into workspace_id
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

drop trigger if exists auth_user_provision_customer_workspace on auth.users;
create trigger auth_user_provision_customer_workspace
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.provision_customer_workspace_from_auth_user();

do $$
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
end;
$$;

-- Recover customer workspaces and make administrator authorization database-backed.
begin;

alter table public.profiles alter column role set default 'user';

drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
for select to authenticated using (id = auth.uid());
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.is_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_administrator() from public;
grant execute on function public.is_administrator() to authenticated;

drop policy if exists "Administrators read profiles" on public.profiles;
create policy "Administrators read profiles" on public.profiles
for select to authenticated using (public.is_administrator());

drop policy if exists "Administrators read payment intents" on public.payment_intents;
create policy "Administrators read payment intents" on public.payment_intents
for select to authenticated using (public.is_administrator());
drop policy if exists "Administrators read legal acceptances" on public.legal_acceptances;
create policy "Administrators read legal acceptances" on public.legal_acceptances
for select to authenticated using (public.is_administrator());
drop policy if exists "Administrators read watchlist entries" on public.watchlist_entries;
create policy "Administrators read watchlist entries" on public.watchlist_entries
for select to authenticated using (public.is_administrator());

create or replace function public.ensure_customer_workspace()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  customer auth.users%rowtype;
begin
  select * into customer from auth.users where id = auth.uid();
  if customer.id is null then
    raise exception 'Authentication is required';
  end if;
  perform public.provision_customer_workspace(customer.id, customer.email, customer.raw_user_meta_data);
end;
$$;
revoke all on function public.ensure_customer_workspace() from public;
grant execute on function public.ensure_customer_workspace() to authenticated;

commit;
notify pgrst, 'reload schema';

-- Secure, audited administrator report access. Application authorization reads profiles.role.
begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));

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

drop trigger if exists profiles_prevent_self_role_change on public.profiles;
create trigger profiles_prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

alter table public.intakes drop constraint if exists intakes_payment_status_check;
alter table public.intakes add constraint intakes_payment_status_check
  check (payment_status in ('payment_pending', 'processing', 'paid', 'admin_comped', 'failed', 'refunded'));

alter table public.reports drop constraint if exists reports_payment_status_check;
alter table public.reports add constraint reports_payment_status_check
  check (payment_status in ('payment_pending', 'processing', 'paid', 'admin_comped', 'failed', 'refunded'));
alter table public.reports add column if not exists access_type text not null default 'customer_payment';
alter table public.reports drop constraint if exists reports_access_type_check;
alter table public.reports add constraint reports_access_type_check
  check (access_type in ('customer_payment', 'administrator'));
create unique index if not exists reports_one_administrator_copy_per_intake
  on public.reports (user_id, intake_id) where access_type = 'administrator';

create table if not exists public.admin_report_audit (
  id uuid primary key default gen_random_uuid(),
  administrator_user_id uuid not null references public.profiles(id),
  investigation_id text not null references public.intakes(intake_id),
  report_id text not null references public.reports(report_id),
  created_at timestamptz not null default now(),
  reason text not null check (reason in ('production testing', 'internal review'))
);

alter table public.admin_report_audit enable row level security;
drop policy if exists admin_report_audit_insert_by_admin on public.admin_report_audit;
create policy admin_report_audit_insert_by_admin on public.admin_report_audit
for insert to authenticated
with check (
  administrator_user_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists admin_report_audit_read_by_admin on public.admin_report_audit;
create policy admin_report_audit_read_by_admin on public.admin_report_audit
for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

grant select, insert on public.admin_report_audit to authenticated;

commit;
notify pgrst, 'reload schema';

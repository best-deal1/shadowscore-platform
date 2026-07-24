-- PR4: immutable, tenant-scoped activity timeline. Payloads are display-safe
-- summaries; provider output and raw evidence remain in their owning stores.
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now(),
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  actor_type text not null check (actor_type in ('user', 'system', 'provider')),
  actor_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  reference_ids uuid[] not null default '{}'
);

create index if not exists timeline_events_case_occurred_idx on public.timeline_events (case_id, occurred_at desc, id desc);
create index if not exists timeline_events_organization_occurred_idx on public.timeline_events (organization_id, occurred_at desc, id desc);

-- Case lifecycle events are written in the same transaction as the mutation.
create or replace function public.record_case_timeline_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_actor uuid := auth.uid();
  actor_kind text := case when current_actor is null then 'system' else 'user' end;
begin
  if tg_op = 'INSERT' then
    insert into public.timeline_events (case_id, organization_id, occurred_at, event_type, actor_type, actor_id, payload)
    values (new.id, new.organization_id, new.created_at, 'case.created', actor_kind, current_actor,
      jsonb_build_object('title', 'Case created', 'detail', new.title));
  elsif new.status is distinct from old.status then
    insert into public.timeline_events (case_id, organization_id, occurred_at, event_type, actor_type, actor_id, payload)
    values (new.id, new.organization_id, new.updated_at, 'case.status_changed', actor_kind, current_actor,
      jsonb_build_object('title', 'Case status changed', 'detail', format('%s to %s', old.status, new.status), 'from', old.status, 'to', new.status));
  elsif new.priority is distinct from old.priority or new.title is distinct from old.title or new.due_at is distinct from old.due_at then
    insert into public.timeline_events (case_id, organization_id, occurred_at, event_type, actor_type, actor_id, payload)
    values (new.id, new.organization_id, new.updated_at, 'case.updated', actor_kind, current_actor,
      jsonb_build_object('title', 'Case details updated'));
  end if;
  return new;
end;
$$;

drop trigger if exists cases_timeline_after_insert on public.cases;
create trigger cases_timeline_after_insert after insert on public.cases
for each row execute function public.record_case_timeline_event();

drop trigger if exists cases_timeline_after_update on public.cases;
create trigger cases_timeline_after_update after update on public.cases
for each row execute function public.record_case_timeline_event();

alter table public.timeline_events enable row level security;

create policy "Active members can read organization timeline events" on public.timeline_events
for select using (exists (
  select 1 from public.organization_memberships membership
  where membership.organization_id = timeline_events.organization_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
));

-- Timeline events are created by audited database workflows. Direct browser
-- mutations are intentionally not allowed.

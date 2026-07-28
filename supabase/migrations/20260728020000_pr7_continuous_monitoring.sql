-- PR7 continuous monitoring. Delivery workers consume notification_events later.
create table if not exists public.monitored_entities (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_id text not null, company text not null, target text not null,
  status text not null default 'paused' check (status in ('active','paused','attention_required','archived')),
  frequency text not null default 'daily' check (frequency in ('daily','weekly','manual')),
  current_trust_score smallint not null check (current_trust_score between 0 and 100),
  last_scan_at timestamptz, last_successful_cycle_at timestamptz, created_at timestamptz not null default now(),
  unique (workspace_id, report_id)
);
create table if not exists public.monitoring_snapshots (
  id uuid primary key default gen_random_uuid(), monitored_entity_id uuid not null references public.monitored_entities(id) on delete cascade,
  trust_score smallint not null check (trust_score between 0 and 100), values jsonb not null default '{}', captured_at timestamptz not null
);
create table if not exists public.monitoring_alerts (
  id uuid primary key default gen_random_uuid(), monitored_entity_id uuid not null references public.monitored_entities(id) on delete cascade,
  company text not null, provider text not null, category text not null,
  severity text not null check (severity in ('low','medium','high','critical')), title text not null, description text not null,
  detected_at timestamptz not null, previous_value jsonb, current_value jsonb, resolved boolean not null default false, fingerprint text not null,
  unique (monitored_entity_id, fingerprint)
);
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(), monitoring_alert_id uuid not null references public.monitoring_alerts(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','webhook')), status text not null default 'pending' check (status in ('pending','cancelled')),
  created_at timestamptz not null default now(), unique (monitoring_alert_id, channel)
);
create index if not exists monitoring_snapshots_timeline_idx on public.monitoring_snapshots(monitored_entity_id, captured_at desc);
create index if not exists monitoring_alerts_timeline_idx on public.monitoring_alerts(monitored_entity_id, detected_at desc);
alter table public.monitored_entities enable row level security; alter table public.monitoring_snapshots enable row level security;
alter table public.monitoring_alerts enable row level security; alter table public.notification_events enable row level security;
create policy monitored_entities_workspace on public.monitored_entities using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy monitoring_snapshots_workspace on public.monitoring_snapshots using (exists (select 1 from public.monitored_entities m where m.id=monitored_entity_id and public.is_workspace_member(m.workspace_id))) with check (exists (select 1 from public.monitored_entities m where m.id=monitored_entity_id and public.is_workspace_member(m.workspace_id)));
create policy monitoring_alerts_workspace on public.monitoring_alerts using (exists (select 1 from public.monitored_entities m where m.id=monitored_entity_id and public.is_workspace_member(m.workspace_id))) with check (exists (select 1 from public.monitored_entities m where m.id=monitored_entity_id and public.is_workspace_member(m.workspace_id)));
create policy notification_events_workspace on public.notification_events using (exists (select 1 from public.monitoring_alerts a join public.monitored_entities m on m.id=a.monitored_entity_id where a.id=monitoring_alert_id and public.is_workspace_member(m.workspace_id))) with check (exists (select 1 from public.monitoring_alerts a join public.monitored_entities m on m.id=a.monitored_entity_id where a.id=monitoring_alert_id and public.is_workspace_member(m.workspace_id)));


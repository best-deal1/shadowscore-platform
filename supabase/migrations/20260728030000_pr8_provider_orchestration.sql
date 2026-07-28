-- PR8. Persist pipeline runs, provider health, cache entries, and an append-only audit trail.
create table public.collector_pipeline_runs (
  pipeline_run_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.organizations(id) on delete restrict,
  investigation_id uuid references public.investigation_jobs(investigation_job_id) on delete restrict, monitored_entity_id uuid references public.monitored_entities(id) on delete restrict,
  plan_id uuid not null, status text not null check (status in ('running','completed','partial','failed')), started_at timestamptz not null default now(), completed_at timestamptz
);
create index collector_pipeline_runs_workspace_idx on public.collector_pipeline_runs(workspace_id,started_at desc);
create table public.provider_health (
  workspace_id uuid not null references public.organizations(id) on delete restrict, collector_key text not null, status text not null check(status in ('healthy','degraded','disabled')),
  consecutive_failures integer not null default 0 check(consecutive_failures >= 0), success_count bigint not null default 0, failure_count bigint not null default 0,
  last_started_at timestamptz, last_succeeded_at timestamptz, last_failed_at timestamptz, last_error text, updated_at timestamptz not null default now(), primary key(workspace_id,collector_key)
);
create table public.collector_cache (
  workspace_id uuid not null references public.organizations(id) on delete cascade, cache_key text not null, collector_key text not null,
  output jsonb not null, created_at timestamptz not null default now(), expires_at timestamptz not null, primary key(workspace_id,cache_key)
);
create index collector_cache_expiry_idx on public.collector_cache(expires_at);
create table public.pipeline_audit_events (
  event_id uuid primary key default gen_random_uuid(), pipeline_run_id uuid not null references public.collector_pipeline_runs(pipeline_run_id) on delete restrict,
  workspace_id uuid not null references public.organizations(id) on delete restrict, collector_key text, event_type text not null,
  details jsonb not null default '{}', occurred_at timestamptz not null default now()
);
create index pipeline_audit_events_run_idx on public.pipeline_audit_events(pipeline_run_id,occurred_at,event_id);
create trigger pipeline_audit_events_append_only before update or delete on public.pipeline_audit_events for each row execute function public.reject_execution_history_mutation();
alter table public.collector_pipeline_runs enable row level security; alter table public.provider_health enable row level security; alter table public.collector_cache enable row level security; alter table public.pipeline_audit_events enable row level security;
create policy pipeline_runs_member_read on public.collector_pipeline_runs for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy provider_health_member_read on public.provider_health for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy pipeline_audit_member_read on public.pipeline_audit_events for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
-- Cache contents and all writes remain service-role only.

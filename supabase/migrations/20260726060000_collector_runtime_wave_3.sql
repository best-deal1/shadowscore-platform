-- Platform Core Phase 2, Wave 3. Generic collector orchestration and append-only history.
create table public.collector_registry (
 collector_key text not null, version text not null, capability text not null,
 supported_subject_types text[] not null, supported_identifier_types text[] not null,
 required_providers text[] not null default '{}', required_entitlements text[] not null default '{}',
 pricing_category text not null, timeout_ms integer not null check(timeout_ms>0), retry_policy jsonb not null,
 priority integer not null default 0, dependencies text[] not null default '{}',
 health_status text not null check(health_status in('healthy','degraded','disabled')),
 registered_at timestamptz not null default now(), primary key(collector_key,version)
);
create table public.collector_executions (
 execution_id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.investigation_jobs(investigation_job_id) on delete restrict,
 workspace_id uuid not null references public.organizations(id) on delete restrict, collector_key text not null, collector_version text not null,
 idempotency_key text not null, status text not null check(status in('pending','queued','running','succeeded','failed','retried','completed','cancelled')),
 attempt_count integer not null default 0, lease_owner text, lease_expires_at timestamptz, cancellation_requested_at timestamptz,
 created_at timestamptz not null default now(), completed_at timestamptz, unique(workspace_id,idempotency_key),
 foreign key(collector_key,collector_version) references public.collector_registry(collector_key,version) on delete restrict
);
create index collector_executions_claim_idx on public.collector_executions(status,lease_expires_at,created_at);
create table public.execution_attempts (
 attempt_id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.collector_executions(execution_id) on delete restrict,
 workspace_id uuid not null references public.organizations(id) on delete restrict, attempt_number integer not null check(attempt_number>0),
 started_at timestamptz not null, finished_at timestamptz, outcome text check(outcome in('succeeded','failed','timed_out','cancelled')),
 sanitized_error text, metrics jsonb not null default '{}', execution_cost jsonb, unique(execution_id,attempt_number)
);
create table public.execution_events (
 event_id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.collector_executions(execution_id) on delete restrict,
 workspace_id uuid not null references public.organizations(id) on delete restrict, status text not null,
 attempt_number integer not null default 0, details jsonb not null default '{}', occurred_at timestamptz not null default now()
);
create index execution_events_history_idx on public.execution_events(execution_id,occurred_at,event_id);
create or replace function public.reject_execution_history_mutation() returns trigger language plpgsql as $$ begin raise exception 'execution history is append-only'; end $$;
create trigger execution_attempts_append_only before update or delete on public.execution_attempts for each row execute function public.reject_execution_history_mutation();
create trigger execution_events_append_only before update or delete on public.execution_events for each row execute function public.reject_execution_history_mutation();

insert into public.collector_registry(collector_key,version,capability,supported_subject_types,supported_identifier_types,required_entitlements,pricing_category,timeout_ms,retry_policy,priority,health_status)
values('website_intelligence','1.0.0','website_intelligence',array['domain','website'],array['domain','hostname','url'],array['investigation'],'website_collection',60000,'{"maxAttempts":2,"baseDelayMs":250,"maxDelayMs":2000}',100,'healthy');

alter table public.collector_registry enable row level security; alter table public.collector_executions enable row level security; alter table public.execution_attempts enable row level security; alter table public.execution_events enable row level security;
create policy collector_registry_member_read on public.collector_registry for select to authenticated using(true);
create policy collector_execution_member_read on public.collector_executions for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy execution_attempt_member_read on public.execution_attempts for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy execution_event_member_read on public.execution_events for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
-- Only the service role creates executions and appends attempts or events.

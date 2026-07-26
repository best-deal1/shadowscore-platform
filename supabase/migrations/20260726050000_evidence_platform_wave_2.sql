-- Platform Core Phase 2, Wave 2. Canonical, append-only evidence and disposable projections.
create table public.evidence_providers (
 provider_id uuid primary key default gen_random_uuid(), provider_key text not null unique, name text not null, status text not null default 'active' check(status in('active','retired')), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.evidence_sources (
 source_id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.evidence_providers(provider_id) on delete restrict, source_key text not null, name text not null, source_kind text not null, schema_version integer not null default 1 check(schema_version>0), status text not null default 'active' check(status in('active','retired')), metadata jsonb not null default '{}', created_at timestamptz not null default now(), unique(provider_id,source_key,schema_version)
);
create table public.evidence_source_instances (
 source_instance_id uuid primary key default gen_random_uuid(), source_id uuid not null references public.evidence_sources(source_id) on delete restrict, investigation_id uuid references public.investigation_jobs(investigation_job_id) on delete restrict, external_reference text, acquired_at timestamptz not null, effective_at timestamptz not null, payload_reference text, payload_hash text not null, collector_key text not null, collector_version text not null, metadata jsonb not null default '{}', recorded_at timestamptz not null default now(), unique(source_id,payload_hash,acquired_at)
);
create table public.evidence_v2_observations (
 observation_id uuid primary key default gen_random_uuid(), source_instance_id uuid not null references public.evidence_source_instances(source_instance_id) on delete restrict, subject_id uuid not null references public.subjects(subject_id) on delete restrict, investigation_id uuid references public.investigation_jobs(investigation_job_id) on delete restrict, observation_type text not null, observation_key text not null, value jsonb not null, observed_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz, status text not null default 'accepted' check(status='accepted'), metadata jsonb not null default '{}', recorded_at timestamptz not null default now(), check(valid_to is null or valid_to>valid_from)
);
create index evidence_v2_observation_subject_idx on public.evidence_v2_observations(subject_id,observed_at desc);
create table public.evidence_normalization_runs (
 normalization_run_id uuid primary key default gen_random_uuid(), observation_id uuid not null references public.evidence_v2_observations(observation_id) on delete restrict, policy_version text not null, status text not null check(status in('completed','quarantined')), completed_stage text not null, created_at timestamptz not null default now()
);
create table public.evidence_assertions (
 assertion_id uuid primary key default gen_random_uuid(), assertion_key text not null, version integer not null check(version>0), taxonomy text not null, subject_id uuid not null references public.subjects(subject_id) on delete restrict, value jsonb not null, provenance jsonb not null, confidence_components jsonb not null, confidence numeric not null check(confidence between 0 and 1), valid_from timestamptz not null, valid_to timestamptz, recorded_at timestamptz not null default now(), supersedes_assertion_id uuid references public.evidence_assertions(assertion_id) on delete restrict, policy_version text not null, canonical_value_hash text not null, check(valid_to is null or valid_to>valid_from), unique(assertion_key,version)
);
create index evidence_assertion_bitemporal_idx on public.evidence_assertions(subject_id,taxonomy,valid_from,valid_to,recorded_at desc);
create index evidence_assertion_dedup_idx on public.evidence_assertions(assertion_key,canonical_value_hash);
create table public.assertion_observation_links (
 evidence_link_id uuid primary key default gen_random_uuid(), assertion_id uuid not null references public.evidence_assertions(assertion_id) on delete restrict, observation_id uuid not null references public.evidence_v2_observations(observation_id) on delete restrict, role text not null check(role in('supporting','contradicting','context')), created_at timestamptz not null default now(), unique(assertion_id,observation_id,role)
);
create table public.evidence_links (
 evidence_link_id uuid primary key default gen_random_uuid(), from_assertion_id uuid not null references public.evidence_assertions(assertion_id) on delete restrict, to_assertion_id uuid not null references public.evidence_assertions(assertion_id) on delete restrict, link_type text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now(), check(from_assertion_id<>to_assertion_id), unique(from_assertion_id,to_assertion_id,link_type)
);
create table public.evidence_quarantine (
 quarantine_id uuid primary key default gen_random_uuid(), source_instance_id uuid references public.evidence_source_instances(source_instance_id) on delete restrict, observation_payload jsonb not null, failed_stage text not null, reason_code text not null, sanitized_message text not null, policy_version text not null, resolution_status text not null default 'pending' check(resolution_status in('pending','released','discarded')), quarantined_at timestamptz not null default now(), resolved_at timestamptz
);
-- This table is a cache. It can be truncated and rebuilt from evidence_assertions.
create table public.current_evidence_projection (
 assertion_key text primary key, assertion_id uuid not null references public.evidence_assertions(assertion_id) on delete cascade, subject_id uuid not null references public.subjects(subject_id) on delete cascade, taxonomy text not null, value jsonb not null, confidence numeric not null, valid_from timestamptz not null, valid_to timestamptz, assertion_version integer not null, projected_at timestamptz not null default now()
);
create index current_evidence_subject_idx on public.current_evidence_projection(subject_id,taxonomy);
create table public.evidence_outbox (
 event_id uuid primary key default gen_random_uuid(), event_type text not null, aggregate_id uuid not null, payload jsonb not null, occurred_at timestamptz not null default now(), published_at timestamptz
);

create or replace function public.reject_evidence_mutation() returns trigger language plpgsql as $$ begin raise exception 'canonical evidence is append-only'; end $$;
do $$ declare t text; begin foreach t in array array['evidence_source_instances','evidence_v2_observations','evidence_normalization_runs','evidence_assertions','assertion_observation_links','evidence_links'] loop execute format('create trigger %I_append_only before update or delete on public.%I for each row execute function public.reject_evidence_mutation()',t,t); end loop; end $$;
create or replace function public.rebuild_current_evidence_projection() returns void language plpgsql security definer set search_path=public as $$ begin
 truncate table public.current_evidence_projection;
 insert into public.current_evidence_projection(assertion_key,assertion_id,subject_id,taxonomy,value,confidence,valid_from,valid_to,assertion_version)
 select distinct on(assertion_key) assertion_key,assertion_id,subject_id,taxonomy,value,confidence,valid_from,valid_to,version from public.evidence_assertions order by assertion_key,version desc,recorded_at desc;
end $$;
revoke all on function public.rebuild_current_evidence_projection() from public,anon,authenticated;

insert into public.evidence_providers(provider_key,name) values('shadowscore-website','ShadowScore Website Intelligence') on conflict do nothing;
insert into public.evidence_sources(provider_id,source_key,name,source_kind,schema_version)
select provider_id,'website-intelligence','Website Intelligence','website_scan',1 from public.evidence_providers where provider_key='shadowscore-website' on conflict do nothing;

alter table public.evidence_providers enable row level security; alter table public.evidence_sources enable row level security; alter table public.evidence_source_instances enable row level security; alter table public.evidence_v2_observations enable row level security; alter table public.evidence_normalization_runs enable row level security; alter table public.evidence_assertions enable row level security; alter table public.assertion_observation_links enable row level security; alter table public.evidence_links enable row level security; alter table public.evidence_quarantine enable row level security; alter table public.current_evidence_projection enable row level security; alter table public.evidence_outbox enable row level security;
create policy evidence_provider_read on public.evidence_providers for select to authenticated using(status='active');
create policy evidence_source_read on public.evidence_sources for select to authenticated using(status='active');
create policy evidence_instance_member_read on public.evidence_source_instances for select to authenticated using(investigation_id is null or exists(select 1 from public.investigation_jobs j where j.investigation_job_id=investigation_id and j.workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active')));
create policy evidence_v2_observation_member_read on public.evidence_v2_observations for select to authenticated using(exists(select 1 from public.subjects s where s.subject_id=subject_id and (s.visibility='public' or s.workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'))));
create policy evidence_assertion_member_read on public.evidence_assertions for select to authenticated using(exists(select 1 from public.subjects s where s.subject_id=subject_id and (s.visibility='public' or s.workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'))));
create policy evidence_projection_member_read on public.current_evidence_projection for select to authenticated using(exists(select 1 from public.subjects s where s.subject_id=subject_id and (s.visibility='public' or s.workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'))));
create policy assertion_links_member_read on public.assertion_observation_links for select to authenticated using(exists(select 1 from public.evidence_assertions a join public.subjects s on s.subject_id=a.subject_id where a.assertion_id=assertion_id and (s.visibility='public' or s.workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'))));
-- Collectors use the service role to append observations. Normalization workers alone append assertions. No authenticated write policies exist.

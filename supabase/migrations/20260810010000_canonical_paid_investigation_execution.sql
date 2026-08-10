-- Canonical paid execution. Additive, retry-safe, and keyed by the intake ID.
begin;

alter table public.investigation_jobs add column if not exists canonical_investigation_id text references public.intakes(intake_id) on delete restrict;
alter table public.investigation_jobs add column if not exists payment_intent_id uuid references public.payment_intents(id) on delete restrict;
create unique index if not exists investigation_jobs_canonical_paid_idx on public.investigation_jobs(canonical_investigation_id) where canonical_investigation_id is not null;
create unique index if not exists investigation_jobs_payment_intent_idx on public.investigation_jobs(payment_intent_id) where payment_intent_id is not null;

create table if not exists public.canonical_investigation_runs (
  investigation_id text primary key references public.intakes(intake_id) on delete restrict,
  investigation_job_id uuid not null unique references public.investigation_jobs(investigation_job_id) on delete restrict,
  payment_intent_id uuid not null unique references public.payment_intents(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued','running','partial','ready','failed')),
  seed jsonb not null, graph jsonb, confidence_projection jsonb, provider_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz, completed_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.canonical_provider_runs (
  provider_run_id text primary key, investigation_id text not null references public.canonical_investigation_runs(investigation_id) on delete restrict,
  provider_id text not null, seed jsonb not null, depth integer not null, status text not null,
  attempts integer not null default 0, evidence_count integer not null default 0, failure_message text, updated_at timestamptz not null default now()
);
create table if not exists public.canonical_evidence_assertions (
  investigation_id text not null references public.canonical_investigation_runs(investigation_id) on delete restrict,
  evidence_id text not null, assertion jsonb not null, source_id text not null, source_url text,
  retrieved_at timestamptz not null, observed_value text not null, source_reliability numeric not null check(source_reliability between 0 and 100),
  primary key(investigation_id,evidence_id)
);

alter table public.canonical_investigation_runs enable row level security;
alter table public.canonical_provider_runs enable row level security;
alter table public.canonical_evidence_assertions enable row level security;
create policy canonical_run_member_read on public.canonical_investigation_runs for select to authenticated using(exists(select 1 from public.intakes i where i.intake_id=investigation_id and (i.user_id=auth.uid() or exists(select 1 from public.organization_memberships m where m.organization_id=i.organization_id and m.user_id=auth.uid() and m.status='active'))));
create policy canonical_provider_member_read on public.canonical_provider_runs for select to authenticated using(exists(select 1 from public.canonical_investigation_runs r where r.investigation_id=canonical_provider_runs.investigation_id));
create policy canonical_evidence_member_read on public.canonical_evidence_assertions for select to authenticated using(exists(select 1 from public.canonical_investigation_runs r where r.investigation_id=canonical_evidence_assertions.investigation_id));
grant select on public.canonical_investigation_runs,public.canonical_provider_runs,public.canonical_evidence_assertions to authenticated;

create or replace function public.confirm_paid_investigation(p_payment_intent_id uuid,p_provider_reference text)
returns table(investigation_id text,investigation_job_id uuid,report_id text,status text)
language plpgsql security definer set search_path=public as $$
declare v_intent public.payment_intents;v_intake public.intakes;v_subject uuid;v_job uuid;v_report text;v_status text;
begin
 select * into v_intent from public.payment_intents where id=p_payment_intent_id and user_id=auth.uid() for update;
 if not found then raise exception 'Payment intent not found.'; end if;
 select * into v_intake from public.intakes where intake_id=v_intent.metadata->>'intakeId' and user_id=auth.uid() for update;
 if not found then raise exception 'Investigation intake not found.'; end if;
 update public.payment_intents set status='paid',provider_reference=coalesce(provider_reference,p_provider_reference),updated_at=now() where id=v_intent.id;
 update public.intakes set payment_status='paid',report_status=case when report_status='ready' then 'ready' else 'generating' end,updated_at=now() where intake_id=v_intake.intake_id;
 select subject_id into v_subject from public.subjects where workspace_id=v_intake.organization_id and canonical_name=lower(v_intake.target) limit 1;
 if v_subject is null then insert into public.subjects(subject_type,canonical_name,display_name,workspace_id) values('domain',lower(v_intake.target),v_intake.target,v_intake.organization_id) returning subject_id into v_subject; end if;
 insert into public.investigation_jobs(subject_id,workspace_id,requested_by_user_id,investigation_type,idempotency_key,current_stage,canonical_investigation_id,payment_intent_id)
 values(v_subject,v_intake.organization_id,v_intake.user_id,'canonical_paid','payment:'||v_intent.id,'live_collection',v_intake.intake_id,v_intent.id)
 on conflict(canonical_investigation_id) where canonical_investigation_id is not null do update set updated_at=now() returning investigation_job_id into v_job;
 insert into public.canonical_investigation_runs(investigation_id,investigation_job_id,payment_intent_id,seed) values(v_intake.intake_id,v_job,v_intent.id,jsonb_build_object('kind',case when v_intake.scan_mode='website' then 'domain' else 'company' end,'value',v_intake.target)) on conflict(investigation_id) do nothing;
 select r.status into v_status from public.canonical_investigation_runs r where r.investigation_id=v_intake.intake_id;
 select r.report_id into v_report from public.reports r where r.payment_intent_id=v_intent.id limit 1;
 return query select v_intake.intake_id,v_job,v_report,v_status;
end $$;
grant execute on function public.confirm_paid_investigation(uuid,text) to authenticated;
commit;
notify pgrst,'reload schema';

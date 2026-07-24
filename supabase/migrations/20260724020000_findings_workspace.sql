-- Findings turn case evidence into an audited analyst assessment. A finding
-- always has at least one evidence link, enforced by the mutation functions.
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 200),
  source text not null check (char_length(source) between 1 and 200),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists evidence_items_case_idx on public.evidence_items(case_id, captured_at desc);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  narrative text not null check (char_length(narrative) between 10 and 10000),
  severity text not null check (severity in ('informational','low','medium','high','critical')),
  confidence text not null check (confidence in ('low','medium','high')),
  tags text[] not null default '{}',
  version integer not null default 1,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists findings_case_updated_idx on public.findings(case_id, updated_at desc);
create table if not exists public.finding_evidence (
  finding_id uuid not null references public.findings(id) on delete cascade,
  evidence_id uuid not null references public.evidence_items(id) on delete restrict,
  primary key (finding_id, evidence_id)
);

alter table public.evidence_items enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
create policy "Members read case evidence" on public.evidence_items for select using (exists (select 1 from public.organization_memberships m where m.organization_id=evidence_items.organization_id and m.user_id=auth.uid() and m.status='active'));
create policy "Members read findings" on public.findings for select using (exists (select 1 from public.organization_memberships m where m.organization_id=findings.organization_id and m.user_id=auth.uid() and m.status='active'));
create policy "Members read finding links" on public.finding_evidence for select using (exists (select 1 from public.findings f join public.organization_memberships m on m.organization_id=f.organization_id where f.id=finding_evidence.finding_id and m.user_id=auth.uid() and m.status='active'));

create or replace function public.assert_finding_context(p_case_public_id text, p_evidence_ids uuid[])
returns public.cases language plpgsql security definer set search_path=public,auth as $$
declare c public.cases; linked_count integer;
begin
  select cases.* into c from public.cases join public.organization_memberships m on m.organization_id=cases.organization_id where cases.public_id=p_case_public_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','manager','analyst');
  if c.id is null then raise exception 'case_not_found'; end if;
  if coalesce(array_length(p_evidence_ids,1),0) < 1 then raise exception 'evidence_required'; end if;
  select count(*) into linked_count from public.evidence_items where case_id=c.id and organization_id=c.organization_id and id=any(p_evidence_ids);
  if linked_count <> array_length(p_evidence_ids,1) then raise exception 'evidence_not_found'; end if;
  return c;
end $$;

create or replace function public.create_finding(p_case_public_id text,p_title text,p_narrative text,p_severity text,p_confidence text,p_tags text[],p_evidence_ids uuid[])
returns setof public.findings language plpgsql security definer set search_path=public,auth as $$
declare c public.cases; f public.findings;
begin
  c := public.assert_finding_context(p_case_public_id,p_evidence_ids);
  insert into public.findings(case_id,organization_id,title,narrative,severity,confidence,tags,created_by,updated_by) values(c.id,c.organization_id,p_title,p_narrative,p_severity,p_confidence,p_tags,auth.uid(),auth.uid()) returning * into f;
  insert into public.finding_evidence(finding_id,evidence_id) select f.id,unnest(p_evidence_ids);
  insert into public.timeline_events(case_id,organization_id,event_type,actor_type,actor_id,payload,reference_ids) values(c.id,c.organization_id,'finding.created','user',auth.uid(),jsonb_build_object('title','Finding created','detail',f.title),array[f.id] || p_evidence_ids);
  return next f;
end $$;

create or replace function public.update_finding(p_case_public_id text,p_finding_public_id text,p_expected_version integer,p_title text,p_narrative text,p_severity text,p_confidence text,p_tags text[],p_evidence_ids uuid[])
returns setof public.findings language plpgsql security definer set search_path=public,auth as $$
declare c public.cases; f public.findings;
begin
  c := public.assert_finding_context(p_case_public_id,p_evidence_ids);
  update public.findings set title=p_title,narrative=p_narrative,severity=p_severity,confidence=p_confidence,tags=p_tags,version=version+1,updated_by=auth.uid(),updated_at=now() where public_id=p_finding_public_id and case_id=c.id and version=p_expected_version returning * into f;
  if f.id is null then return; end if;
  delete from public.finding_evidence where finding_id=f.id; insert into public.finding_evidence select f.id,unnest(p_evidence_ids);
  insert into public.timeline_events(case_id,organization_id,event_type,actor_type,actor_id,payload,reference_ids) values(c.id,c.organization_id,'finding.updated','user',auth.uid(),jsonb_build_object('title','Finding updated','detail',f.title),array[f.id] || p_evidence_ids);
  return next f;
end $$;

create or replace function public.delete_finding(p_case_public_id text,p_finding_public_id text,p_expected_version integer)
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare c public.cases; f public.findings;
begin
  c := public.assert_finding_context(p_case_public_id,array[(select id from public.evidence_items where case_id=(select id from public.cases where public_id=p_case_public_id) limit 1)]);
  delete from public.findings where public_id=p_finding_public_id and case_id=c.id and version=p_expected_version returning * into f;
  if f.id is null then return false; end if;
  insert into public.timeline_events(case_id,organization_id,event_type,actor_type,actor_id,payload,reference_ids) values(c.id,c.organization_id,'finding.deleted','user',auth.uid(),jsonb_build_object('title','Finding deleted','detail',f.title),array[f.id]);
  return true;
end $$;

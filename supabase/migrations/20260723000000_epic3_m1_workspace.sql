-- Epic 3 M1: organization-scoped case workspace. This migration is forward-only.
create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  plan text not null default 'personal',
  personal_owner_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','analyst','viewer')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  public_id text not null default ('case_' || replace(gen_random_uuid()::text, '-', '')),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  investigation_id text not null,
  title text not null check (char_length(title) between 1 and 240),
  status text not null default 'draft' check (status in ('draft','active','awaiting_input','under_review','monitoring','closed','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  owner_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, public_id), unique (organization_id, investigation_id)
);
create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade, key text not null check (char_length(key) between 1 and 255),
  request_hash text not null, response_status integer, response_body jsonb, created_at timestamptz not null default now(), completed_at timestamptz,
  unique (organization_id, actor_id, key)
);
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade, occurred_at timestamptz not null default now(), recorded_at timestamptz not null default now(),
  event_type text not null check (event_type in ('case.created','case.updated','case.assigned','case.priority_changed')),
  actor_type text not null check (actor_type in ('user','system','provider')), actor_id uuid references auth.users(id), payload jsonb not null default '{}'::jsonb
);
create index cases_organization_status_updated_idx on public.cases (organization_id, status, updated_at desc);
create index cases_organization_owner_status_idx on public.cases (organization_id, owner_id, status);
create index cases_organization_priority_updated_idx on public.cases (organization_id, priority, updated_at desc);
create index organization_memberships_user_active_idx on public.organization_memberships (user_id, organization_id) where status = 'active';
create index timeline_events_case_occurred_idx on public.timeline_events (case_id, occurred_at desc, id desc);
create index idempotency_keys_organization_actor_created_idx on public.idempotency_keys (organization_id, actor_id, created_at desc);

-- Existing authenticated users get exactly one personal organization unless they already own one.
insert into public.organizations (id, name, plan, personal_owner_id)
select gen_random_uuid(), coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) || '''s organization', 'personal', p.id
from public.profiles p
where not exists (select 1 from public.organization_memberships m where m.user_id = p.id and m.role = 'owner');
insert into public.organization_memberships (organization_id, user_id, role)
select o.id, p.id, 'owner' from public.profiles p join lateral (
  select id from public.organizations where personal_owner_id = p.id
) o on true where not exists (select 1 from public.organization_memberships m where m.user_id = p.id and m.role = 'owner');

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.cases enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.timeline_events enable row level security;

create function public.is_active_organization_member(target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
 select exists (select 1 from public.organization_memberships where organization_id = target_organization_id and user_id = auth.uid() and status = 'active');
$$;
create policy organizations_member_read on public.organizations for select using (public.is_active_organization_member(id));
create policy memberships_member_read on public.organization_memberships for select using (public.is_active_organization_member(organization_id));
create policy memberships_owner_manage on public.organization_memberships for all using (exists (select 1 from public.organization_memberships m where m.organization_id = organization_memberships.organization_id and m.user_id = auth.uid() and m.status = 'active' and m.role = 'owner')) with check (exists (select 1 from public.organization_memberships m where m.organization_id = organization_memberships.organization_id and m.user_id = auth.uid() and m.status = 'active' and m.role = 'owner'));
create policy cases_member_read on public.cases for select using (public.is_active_organization_member(organization_id));
create policy cases_contributor_write on public.cases for insert with check (public.is_active_organization_member(organization_id) and created_by = auth.uid() and exists (select 1 from public.organization_memberships m where m.organization_id = cases.organization_id and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager','analyst')));
create policy cases_contributor_update on public.cases for update using (public.is_active_organization_member(organization_id) and exists (select 1 from public.organization_memberships m where m.organization_id = cases.organization_id and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager','analyst'))) with check (public.is_active_organization_member(organization_id));
create policy idempotency_actor_manage on public.idempotency_keys for all using (organization_id in (select organization_id from public.organization_memberships where user_id = auth.uid() and status = 'active') and actor_id = auth.uid()) with check (organization_id in (select organization_id from public.organization_memberships where user_id = auth.uid() and status = 'active') and actor_id = auth.uid());
create policy timeline_member_read on public.timeline_events for select using (public.is_active_organization_member(organization_id));
create policy timeline_contributor_insert on public.timeline_events for insert with check (public.is_active_organization_member(organization_id) and actor_id = auth.uid());
-- Timelines are append-only. Intentionally no UPDATE or DELETE policy.
create function public.workspace_create_case(investigation_id text, title text, priority text, owner_id uuid default null, due_at timestamptz default null, idempotency_key text default null, request_hash text default null)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare org uuid; result jsonb; existing jsonb; case_row public.cases%rowtype;
begin
 select organization_id into org from public.organization_memberships where user_id=auth.uid() and status='active' order by created_at limit 1;
 if org is null then raise exception 'workspace_access_denied'; end if;
 if idempotency_key is null or request_hash is null then raise exception 'idempotency_key_required'; end if;
 select response_body into existing from public.idempotency_keys where organization_id=org and actor_id=auth.uid() and key=idempotency_key;
 if existing is not null then return existing; end if;
 insert into public.idempotency_keys(organization_id,actor_id,key,request_hash) values(org,auth.uid(),idempotency_key,request_hash);
 insert into public.cases(organization_id,investigation_id,title,priority,owner_id,due_at,created_by) values(org,investigation_id,title,priority,coalesce(owner_id,auth.uid()),due_at,auth.uid()) returning * into case_row;
 insert into public.timeline_events(organization_id,case_id,event_type,actor_type,actor_id,payload) values(org,case_row.id,'case.created','user',auth.uid(),jsonb_build_object('publicId',case_row.public_id));
 result:=jsonb_build_object('case',jsonb_build_object('id',case_row.public_id,'title',case_row.title,'target',case_row.investigation_id,'status',case_row.status,'priority',case_row.priority,'ownerId',case_row.owner_id,'dueAt',case_row.due_at,'updatedAt',case_row.updated_at,'version',case_row.version));
 update public.idempotency_keys set response_status=201,response_body=result,completed_at=now() where organization_id=org and actor_id=auth.uid() and key=idempotency_key; return result;
exception when unique_violation then select response_body into existing from public.idempotency_keys where organization_id=org and actor_id=auth.uid() and key=idempotency_key; return existing;
end $$;
create function public.workspace_update_case(public_id text, version integer, title text default null, status text default null, priority text default null, owner_id uuid default null, due_at timestamptz default null, idempotency_key text default null, request_hash text default null)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare org uuid; c public.cases%rowtype; old_owner uuid; old_priority text; result jsonb; existing jsonb;
begin
 select organization_id into org from public.organization_memberships where user_id=auth.uid() and status='active' order by created_at limit 1; if org is null then raise exception 'workspace_access_denied'; end if;
 if idempotency_key is null or request_hash is null then raise exception 'idempotency_key_required'; end if;
 select response_body into existing from public.idempotency_keys where organization_id=org and actor_id=auth.uid() and key=idempotency_key; if existing is not null then return existing; end if;
 insert into public.idempotency_keys(organization_id,actor_id,key,request_hash) values(org,auth.uid(),idempotency_key,request_hash);
 select * into c from public.cases where organization_id=org and cases.public_id=workspace_update_case.public_id for update; if not found then raise exception 'case_not_found'; end if;
 if c.version <> workspace_update_case.version then raise exception 'case_version_conflict:%', jsonb_build_object('id',c.public_id,'version',c.version)::text; end if;
 old_owner:=c.owner_id; old_priority:=c.priority;
 update public.cases set title=coalesce(workspace_update_case.title,c.title),status=coalesce(workspace_update_case.status,c.status),priority=coalesce(workspace_update_case.priority,c.priority),owner_id=coalesce(workspace_update_case.owner_id,c.owner_id),due_at=coalesce(workspace_update_case.due_at,c.due_at),version=c.version+1,updated_at=now() where id=c.id returning * into c;
 insert into public.timeline_events(organization_id,case_id,event_type,actor_type,actor_id,payload) values(org,c.id,'case.updated','user',auth.uid(),'{}');
 if c.owner_id is distinct from old_owner then insert into public.timeline_events(organization_id,case_id,event_type,actor_type,actor_id,payload) values(org,c.id,'case.assigned','user',auth.uid(),'{}'); end if;
 if c.priority is distinct from old_priority then insert into public.timeline_events(organization_id,case_id,event_type,actor_type,actor_id,payload) values(org,c.id,'case.priority_changed','user',auth.uid(),'{}'); end if;
 result:=jsonb_build_object('case',jsonb_build_object('id',c.public_id,'title',c.title,'target',c.investigation_id,'status',c.status,'priority',c.priority,'ownerId',c.owner_id,'dueAt',c.due_at,'updatedAt',c.updated_at,'version',c.version));
 update public.idempotency_keys set response_status=200,response_body=result,completed_at=now() where organization_id=org and actor_id=auth.uid() and key=idempotency_key; return result;
end $$;

-- Wave 5: append-only entity intelligence ledger and rebuildable projections.
create table if not exists public.entity_observations (
  observation_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null, source_record_id text not null, attribute text not null, observed_value text not null, normalized_value text not null,
  observed_at timestamptz not null, jurisdiction text, evidence_reference text not null, reliability numeric(5,4) not null check (reliability between 0 and 1),
  schema_version text not null default 'entity-observation@1.0.0', recorded_at timestamptz not null default now(), unique(workspace_id,source,source_record_id,attribute,observed_value)
);
create table if not exists public.canonical_entities (
  entity_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, entity_type text not null,
  canonical_name text not null, status text not null default 'unknown', jurisdiction text, projection jsonb not null default '{}'::jsonb,
  projection_version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.entity_observation_links (
  link_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  observation_id uuid not null references public.entity_observations(observation_id), entity_id uuid not null references public.canonical_entities(entity_id),
  decision_id uuid, valid_from timestamptz not null default now(), valid_to timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.entity_resolution_decisions (
  decision_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  left_entity_id uuid not null references public.canonical_entities(entity_id), right_entity_id uuid not null references public.canonical_entities(entity_id),
  outcome text not null check(outcome in ('MATCH','POSSIBLE_MATCH','NO_MATCH','CONFLICT','REVIEW_REQUIRED','ABSTAIN')), confidence numeric(5,4) not null check(confidence between 0 and 1),
  explanation jsonb not null, resolver_version text not null, policy_version text not null, input_observation_ids uuid[] not null default '{}',
  supersedes_decision_id uuid references public.entity_resolution_decisions(decision_id), decided_at timestamptz not null default now(), created_by text not null default 'resolver'
);
alter table public.entity_observation_links add constraint entity_observation_links_decision_fk foreign key(decision_id) references public.entity_resolution_decisions(decision_id);
create table if not exists public.entity_resolution_reviews (
  review_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  decision_id uuid not null references public.entity_resolution_decisions(decision_id), action text not null check(action in ('approved','rejected','split','deferred')),
  actor_id uuid not null, reason text not null check(length(trim(reason))>0), reviewed_at timestamptz not null default now()
);
create table if not exists public.entity_relationships (
  relationship_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_entity_id uuid not null references public.canonical_entities(entity_id), target_entity_id uuid not null references public.canonical_entities(entity_id),
  relationship_type text not null, confidence numeric(5,4) not null check(confidence between 0 and 1), evidence_references text[] not null default '{}',
  valid_from timestamptz not null default now(), valid_to timestamptz, supersedes_relationship_id uuid references public.entity_relationships(relationship_id), created_at timestamptz not null default now()
);
create index if not exists entity_observations_normalized_idx on public.entity_observations(workspace_id,attribute,normalized_value);
create index if not exists entity_resolution_queue_idx on public.entity_resolution_decisions(workspace_id,outcome,decided_at desc);
create index if not exists entity_relationship_source_idx on public.entity_relationships(workspace_id,source_entity_id);
alter table public.entity_observations enable row level security; alter table public.canonical_entities enable row level security; alter table public.entity_observation_links enable row level security;
alter table public.entity_resolution_decisions enable row level security; alter table public.entity_resolution_reviews enable row level security; alter table public.entity_relationships enable row level security;
create policy entity_observations_workspace on public.entity_observations using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy canonical_entities_workspace on public.canonical_entities using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy entity_observation_links_workspace on public.entity_observation_links using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy entity_resolution_decisions_workspace on public.entity_resolution_decisions using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy entity_resolution_reviews_workspace on public.entity_resolution_reviews using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy entity_relationships_workspace on public.entity_relationships using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create or replace function public.reject_entity_observation_mutation() returns trigger language plpgsql as $$ begin raise exception 'entity observations are immutable'; end $$;
create trigger entity_observations_immutable before update or delete on public.entity_observations for each row execute function public.reject_entity_observation_mutation();
create or replace function public.reject_resolution_decision_mutation() returns trigger language plpgsql as $$ begin raise exception 'resolution decisions are append-only'; end $$;
create trigger entity_resolution_decisions_append_only before update or delete on public.entity_resolution_decisions for each row execute function public.reject_resolution_decision_mutation();

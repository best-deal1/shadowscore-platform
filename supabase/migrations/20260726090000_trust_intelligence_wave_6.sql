-- Wave 6: versioned, append-only trust intelligence history.
create table if not exists public.trust_policies (
  policy_version text primary key, policy jsonb not null, computation_version text not null,
  activated_at timestamptz not null, retired_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.trust_signals (
  signal_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_id uuid not null references public.canonical_entities(entity_id), dimension text not null, factor text not null,
  effect text not null check(effect in ('positive','negative')), strength numeric(5,4) not null check(strength between 0 and 1),
  confidence numeric(5,4) not null check(confidence between 0 and 1), observed_at timestamptz not null, expires_at timestamptz,
  evidence_references text[] not null check(cardinality(evidence_references)>0), source_reliability numeric(5,4) not null,
  corroboration numeric(5,4) not null, description text not null, recorded_at timestamptz not null default now()
);
create table if not exists public.trust_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_id uuid not null references public.canonical_entities(entity_id), scores jsonb not null, overall smallint not null check(overall between 0 and 100),
  confidence numeric(5,4) not null check(confidence between 0 and 1), recommendation text not null, policy_version text not null references public.trust_policies(policy_version),
  computation_version text not null, input_signal_ids uuid[] not null, previous_snapshot_id uuid references public.trust_snapshots(snapshot_id),
  change_reason text not null, computed_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.trust_alerts (
  alert_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_id uuid not null references public.canonical_entities(entity_id), snapshot_id uuid not null references public.trust_snapshots(snapshot_id),
  alert_type text not null, severity text not null, explanation text not null, evidence_references text[] not null default '{}',
  created_at timestamptz not null, resolved_at timestamptz
);
create index if not exists trust_snapshots_history_idx on public.trust_snapshots(workspace_id,entity_id,computed_at desc);
create index if not exists trust_signals_entity_idx on public.trust_signals(workspace_id,entity_id,observed_at desc);
create index if not exists trust_alerts_active_idx on public.trust_alerts(workspace_id,entity_id,created_at desc) where resolved_at is null;
alter table public.trust_signals enable row level security; alter table public.trust_snapshots enable row level security; alter table public.trust_alerts enable row level security;
create policy trust_signals_workspace on public.trust_signals using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy trust_snapshots_workspace on public.trust_snapshots using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy trust_alerts_workspace on public.trust_alerts using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create or replace function public.reject_trust_history_mutation() returns trigger language plpgsql as $$ begin raise exception 'trust history is append-only'; end $$;
create trigger trust_signals_immutable before update or delete on public.trust_signals for each row execute function public.reject_trust_history_mutation();
create trigger trust_snapshots_immutable before update or delete on public.trust_snapshots for each row execute function public.reject_trust_history_mutation();

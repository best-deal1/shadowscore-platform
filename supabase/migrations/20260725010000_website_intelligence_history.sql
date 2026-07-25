-- Immutable Website Intelligence scan history and generated change reports.
create table if not exists public.website_intelligence_scans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target text not null,
  scanned_at timestamptz not null,
  report jsonb not null,
  change_report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists website_intelligence_scans_target_history
  on public.website_intelligence_scans (user_id, target, scanned_at desc);

alter table public.website_intelligence_scans enable row level security;
create policy "Users can read own website scan history" on public.website_intelligence_scans
  for select using (auth.uid() = user_id);
create policy "Users can append own website scans" on public.website_intelligence_scans
  for insert with check (auth.uid() = user_id);

-- UPDATE and DELETE policies are intentionally absent. Historical scans are append-only.

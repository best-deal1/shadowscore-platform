-- Append-only Website Intelligence scan history and generated comparisons.
create table if not exists public.website_intelligence_scans (
  scan_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id text references public.reports(report_id) on delete set null,
  target text not null,
  scanned_at timestamptz not null,
  previous_scan_id text references public.website_intelligence_scans(scan_id) on delete restrict,
  scan_snapshot jsonb not null,
  change_report jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, target, scanned_at)
);

create index if not exists website_intelligence_scans_timeline_idx
  on public.website_intelligence_scans (user_id, target, scanned_at desc);

alter table public.website_intelligence_scans enable row level security;
create policy "Users can read own website scan history" on public.website_intelligence_scans for select using (auth.uid() = user_id);
create policy "Users can append own website scan history" on public.website_intelligence_scans for insert with check (auth.uid() = user_id);

create or replace function public.prevent_website_scan_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Website Intelligence scan history is immutable';
end;
$$;

create trigger website_intelligence_scans_no_update
  before update on public.website_intelligence_scans for each row execute function public.prevent_website_scan_mutation();
create trigger website_intelligence_scans_no_delete
  before delete on public.website_intelligence_scans for each row execute function public.prevent_website_scan_mutation();

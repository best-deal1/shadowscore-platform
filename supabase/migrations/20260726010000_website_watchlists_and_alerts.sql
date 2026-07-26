create table public.website_watchlist (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null, monitoring_status text not null default 'Active' check (monitoring_status in ('Active','Paused')),
  created_at timestamptz not null default now(), last_scanned_at timestamptz, latest_risk_level text not null default 'None',
  latest_change_count integer not null default 0, next_scan_at timestamptz, unique (user_id, domain)
);
create table public.website_alerts (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade, domain text not null,
  category text not null check (category in ('SSL/TLS','DNS','HTTP','WHOIS','Security Headers','Reputation')),
  severity text not null check (severity in ('Critical','High','Medium','Low')), field text not null,
  previous_value text, current_value text, detected_at timestamptz not null, explanation text not null,
  recommended_action text not null, evidence_source text not null, current_scan_id text not null references public.website_intelligence_scans(scan_id) on delete restrict,
  previous_scan_id text not null references public.website_intelligence_scans(scan_id) on delete restrict,
  status text not null default 'New' check (status in ('New','Reviewing','Resolved','Dismissed')),
  unique (current_scan_id, category, field)
);
alter table public.website_watchlist enable row level security; alter table public.website_alerts enable row level security;
create policy "Users manage own website watchlist" on public.website_watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own website alerts" on public.website_alerts for select using (auth.uid() = user_id);
create policy "Users create own website alerts" on public.website_alerts for insert with check (auth.uid() = user_id);
create policy "Users update own website alert status" on public.website_alerts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create or replace function public.protect_website_alert_fields() returns trigger language plpgsql as $$ begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then raise exception 'Only alert status may be updated'; end if; return new;
end; $$;
create trigger website_alerts_status_only before update on public.website_alerts for each row execute function public.protect_website_alert_fields();

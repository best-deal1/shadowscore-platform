-- ShadowScore V19 production authentication and workspace database foundation.
-- Supabase Auth owns credentials, password hashing, sessions, password reset and email verification.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id text not null unique,
  title text not null,
  entity text not null,
  platform text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  confidence_score integer not null check (confidence_score between 0 and 100),
  stage text not null check (stage in ('Healthy', 'Warning', 'Restricted', 'Suspended', 'Critical')),
  source text not null,
  top_factors jsonb not null default '[]'::jsonb,
  risk_engine_version text not null,
  provider_versions jsonb not null default '{}'::jsonb,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  report_version text not null default 'v19',
  score_explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Marketplace', 'Payment', 'Business', 'Website', 'Supplier')),
  status text not null default 'Monitoring' check (status in ('Monitoring', 'Needs Evidence', 'Stable', 'High Risk')),
  last_score integer not null default 50 check (last_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'manual',
  provider_reference text,
  plan_name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  method text not null,
  status text not null default 'requires_payment' check (status in ('created', 'requires_payment', 'processing', 'succeeded', 'cancelled', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  legal_version text not null,
  terms_version text not null,
  privacy_version text not null,
  source text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.watchlist_entries enable row level security;
alter table public.payment_intents enable row level security;
alter table public.legal_acceptances enable row level security;

create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can manage own reports" on public.reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own watchlist" on public.watchlist_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own payment intents" on public.payment_intents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own legal acceptances" on public.legal_acceptances for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

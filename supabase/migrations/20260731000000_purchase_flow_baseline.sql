-- Minimal production baseline for the current purchase flow.
-- Supabase SQL Editor: open a new query, paste this entire file, and select Run.
-- After it succeeds, verify REST visibility with an authenticated user JWT:
-- curl --fail-with-body "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/intakes?select=intake_id&limit=1" \
--   -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_USER_JWT"

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_id text not null unique,
  scan_mode text not null check (scan_mode in ('website', 'marketplace', 'evidence')),
  target text not null,
  platform text not null,
  case_type text,
  email text not null,
  file_names jsonb not null default '[]'::jsonb,
  visible_signal_categories jsonb not null default '[]'::jsonb,
  payment_status text not null default 'payment_pending' check (payment_status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded')),
  report_status text not null default 'preview' check (report_status in ('preview', 'payment_pending', 'generating', 'ready', 'failed')),
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
  status text not null default 'requires_payment' check (status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded', 'created', 'requires_payment', 'succeeded', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id text not null unique,
  intake_id text references public.intakes(intake_id) on delete set null,
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  title text not null,
  entity text not null,
  platform text not null,
  scan_mode text,
  target text,
  risk_score integer not null check (risk_score between 0 and 100),
  confidence_score integer not null check (confidence_score between 0 and 100),
  stage text not null check (stage in ('Healthy', 'Warning', 'Restricted', 'Suspended', 'Critical')),
  source text not null,
  top_factors jsonb not null default '[]'::jsonb,
  risk_engine_version text not null,
  provider_versions jsonb not null default '{}'::jsonb,
  provider_results jsonb not null default '[]'::jsonb,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  report_version text not null default 'v19',
  score_explanation text not null,
  payment_status text not null default 'paid' check (payment_status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded')),
  report_status text not null default 'ready' check (report_status in ('preview', 'payment_pending', 'generating', 'ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  ready_at timestamptz
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

-- Add the purchase-flow report fields when the earlier reports table is already present.
alter table public.reports add column if not exists intake_id text;
alter table public.reports add column if not exists payment_intent_id uuid references public.payment_intents(id) on delete set null;
alter table public.reports add column if not exists scan_mode text;
alter table public.reports add column if not exists target text;
alter table public.reports add column if not exists ready_at timestamptz;
alter table public.reports add column if not exists payment_status text not null default 'paid';
alter table public.reports add column if not exists report_status text not null default 'ready';
alter table public.reports add column if not exists provider_results jsonb not null default '[]'::jsonb;
alter table public.reports add column if not exists metadata jsonb not null default '{}'::jsonb;

-- The foundation migration used a narrower status check. Expand it to the states
-- already written by the current checkout and payment completion runtime.
alter table public.payment_intents drop constraint if exists payment_intents_status_check;
alter table public.payment_intents add constraint payment_intents_status_check
  check (status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded', 'created', 'requires_payment', 'succeeded', 'cancelled'));

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname = 'reports_intake_id_fkey' and conrelid = 'public.reports'::regclass) then
    alter table public.reports add constraint reports_intake_id_fkey foreign key (intake_id) references public.intakes(intake_id) on delete set null;
  end if;
end
$constraints$;

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists intakes_user_created_at_idx on public.intakes (user_id, created_at desc);
create index if not exists reports_user_created_at_idx on public.reports (user_id, created_at desc);
create index if not exists reports_intake_id_idx on public.reports (intake_id);
create index if not exists legal_acceptances_user_accepted_at_idx on public.legal_acceptances (user_id, accepted_at desc);
create index if not exists legal_acceptances_payment_intent_id_idx on public.legal_acceptances (payment_intent_id);
create index if not exists payment_intents_user_created_at_idx on public.payment_intents (user_id, created_at desc);
create index if not exists watchlist_entries_user_updated_at_idx on public.watchlist_entries (user_id, updated_at desc);
create unique index if not exists payment_intents_one_active_per_intake
  on public.payment_intents (user_id, (metadata ->> 'intakeId'))
  where status in ('payment_pending', 'processing', 'paid', 'requires_payment', 'succeeded')
    and metadata ->> 'intakeId' is not null;
create unique index if not exists reports_one_per_payment_intent
  on public.reports (payment_intent_id) where payment_intent_id is not null;

alter table public.profiles enable row level security;
alter table public.intakes enable row level security;
alter table public.reports enable row level security;
alter table public.payment_intents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.watchlist_entries enable row level security;

do $policies$
declare
  policy_spec record;
begin
  for policy_spec in
    select * from (values
      ('profiles', 'purchase_flow_own_profile', 'id'),
      ('intakes', 'purchase_flow_own_intakes', 'user_id'),
      ('reports', 'purchase_flow_own_reports', 'user_id'),
      ('payment_intents', 'purchase_flow_own_payment_intents', 'user_id'),
      ('legal_acceptances', 'purchase_flow_own_legal_acceptances', 'user_id'),
      ('watchlist_entries', 'purchase_flow_own_watchlist_entries', 'user_id')
    ) as policies(table_name, policy_name, owner_column)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = policy_spec.table_name
        and policyname = policy_spec.policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (auth.uid() = %I) with check (auth.uid() = %I)',
        policy_spec.policy_name,
        policy_spec.table_name,
        policy_spec.owner_column,
        policy_spec.owner_column
      );
    end if;
  end loop;
end
$policies$;

grant select, insert, update, delete on public.profiles, public.intakes, public.reports,
  public.payment_intents, public.legal_acceptances, public.watchlist_entries to authenticated;

commit;

notify pgrst, 'reload schema';

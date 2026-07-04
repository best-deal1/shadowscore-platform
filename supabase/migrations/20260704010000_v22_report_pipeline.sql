-- ShadowScore V22 payment-to-report unlock pipeline additions.

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

alter table public.payment_intents drop constraint if exists payment_intents_status_check;
alter table public.payment_intents add constraint payment_intents_status_check check (status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded', 'created', 'requires_payment', 'succeeded', 'cancelled'));

alter table public.reports add column if not exists intake_id text;
alter table public.reports add column if not exists payment_intent_id uuid references public.payment_intents(id) on delete set null;
alter table public.reports add column if not exists scan_mode text;
alter table public.reports add column if not exists target text;
alter table public.reports add column if not exists ready_at timestamptz;
alter table public.reports add column if not exists payment_status text not null default 'paid' check (payment_status in ('payment_pending', 'processing', 'paid', 'failed', 'refunded'));
alter table public.reports add column if not exists report_status text not null default 'ready' check (report_status in ('preview', 'payment_pending', 'generating', 'ready', 'failed'));
alter table public.reports add column if not exists provider_results jsonb not null default '[]'::jsonb;
alter table public.reports add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.intakes enable row level security;
create policy "Users can manage own intakes" on public.intakes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

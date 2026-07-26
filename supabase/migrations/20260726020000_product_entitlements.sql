-- Product access is modeled independently from payment providers and prices.
create table if not exists public.product_catalog (
  product_id text primary key,
  product_type text not null check (product_type in ('instant_report', 'monitoring')),
  billing_model text not null check (billing_model in ('one_time', 'recurring')),
  name text not null,
  feature_entitlements jsonb not null default '[]'::jsonb,
  monitored_asset_limit integer not null check (monitored_asset_limit >= 0),
  investigation_limit integer not null check (investigation_limit >= 0),
  report_limit integer not null check (report_limit >= 0),
  export_permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  product_id text not null references public.product_catalog(product_id),
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'cancelled')),
  billing_provider text,
  provider_reference text,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create unique index if not exists workspace_one_live_subscription_idx
  on public.workspace_subscriptions (workspace_id)
  where status in ('pending', 'active', 'past_due');

create table if not exists public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_catalog(product_id),
  scope text not null check (scope in ('report', 'workspace')),
  report_id uuid references public.reports(id) on delete cascade,
  workspace_id uuid references public.organizations(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source_type text not null,
  source_id text,
  created_at timestamptz not null default now(),
  check ((scope = 'report' and report_id is not null and workspace_id is null)
    or (scope = 'workspace' and workspace_id is not null and report_id is null))
);

create table if not exists public.guest_report_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  report_public_id text not null,
  claim_token_hash text not null unique,
  download_token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (claimed_at is null or claimed_by_user_id is not null)
);

alter table public.product_catalog enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.entitlement_grants enable row level security;
alter table public.guest_report_purchases enable row level security;

create policy "Authenticated users can read active products" on public.product_catalog
  for select to authenticated using (active);
create policy "Members can read workspace subscriptions" on public.workspace_subscriptions
  for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = public.workspace_subscriptions.workspace_id and membership.user_id = auth.uid() and membership.status = 'active'
  ));
create policy "Members can read workspace grants" on public.entitlement_grants
  for select to authenticated using (
    (scope = 'workspace' and exists (
      select 1 from public.organization_memberships membership
      where membership.organization_id = public.entitlement_grants.workspace_id and membership.user_id = auth.uid() and membership.status = 'active'
    ))
    or (scope = 'report' and exists (
      select 1 from public.reports report where report.id = public.entitlement_grants.report_id and report.user_id = auth.uid()
    ))
  );

-- Guest purchase writes and claims stay behind server-side service credentials.
insert into public.product_catalog
  (product_id, product_type, billing_model, name, feature_entitlements, monitored_asset_limit, investigation_limit, report_limit, export_permissions)
values
  ('instant_report', 'instant_report', 'one_time', 'Instant Report', '["instant_report.generate", "report.pdf_export"]', 0, 1, 1, '["pdf"]'),
  ('starter_monitoring', 'monitoring', 'recurring', 'Starter Monitoring', '["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "report.monthly"]', 3, 5, 1, '[]'),
  ('professional_monitoring', 'monitoring', 'recurring', 'Professional Monitoring', '["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "dashboard.executive", "report.monthly", "report.pdf_export"]', 25, 50, 10, '["pdf"]'),
  ('business_monitoring', 'monitoring', 'recurring', 'Business Monitoring', '["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "dashboard.executive", "report.monthly", "report.pdf_export", "api.access"]', 100, 250, 50, '["pdf"]')
on conflict (product_id) do update set
  product_type = excluded.product_type,
  billing_model = excluded.billing_model,
  name = excluded.name,
  feature_entitlements = excluded.feature_entitlements,
  monitored_asset_limit = excluded.monitored_asset_limit,
  investigation_limit = excluded.investigation_limit,
  report_limit = excluded.report_limit,
  export_permissions = excluded.export_permissions,
  updated_at = now();

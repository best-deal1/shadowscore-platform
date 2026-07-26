-- Platform Core Phase 2, Wave 1. Registry, pricing, cost, usage, and entitlement foundations.
-- This migration only adds structures. Existing Website Intelligence and product grants remain valid.

create table public.platform_registry_entries (
  registry_entry_id uuid primary key default gen_random_uuid(), registry_type text not null check (registry_type in ('subject_type','identifier_type','feature','usage_metric','cost_source','billing_unit')),
  registry_key text not null, version integer not null default 1 check (version > 0), display_name text not null, status text not null default 'active' check (status in ('draft','active','retired')),
  configuration jsonb not null default '{}', created_at timestamptz not null default now(), retired_at timestamptz, unique (registry_type,registry_key,version)
);

create table public.pricing_policies (
  pricing_policy_id uuid primary key default gen_random_uuid(), policy_key text not null, version integer not null check (version > 0), currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','active','retired')), effective_from timestamptz not null, effective_until timestamptz,
  metadata jsonb not null default '{}', created_at timestamptz not null default now(), check (effective_until is null or effective_until > effective_from), unique(policy_key,version)
);
create unique index pricing_policy_active_version_idx on public.pricing_policies(policy_key) where status='active' and effective_until is null;

create table public.pricing_policy_rules (
  pricing_rule_id uuid primary key default gen_random_uuid(), pricing_policy_id uuid not null references public.pricing_policies(pricing_policy_id) on delete restrict,
  cost_source text not null check (cost_source in ('internal_execution','external_provider','ai_model','storage','monitoring_recurring','manual_review')),
  billing_unit text not null check (billing_unit in ('investigation','collector','provider','observation','assertion','monitoring_cycle','api_request')),
  provider text, collector_key text, unit_price numeric(20,8) not null check (unit_price >= 0), minimum_quantity numeric(20,8) not null default 0 check (minimum_quantity >= 0), configuration jsonb not null default '{}', created_at timestamptz not null default now()
);
create index pricing_rules_policy_lookup_idx on public.pricing_policy_rules(pricing_policy_id,cost_source,billing_unit,provider,collector_key);

create table public.collector_executions (
  execution_id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.investigation_jobs(investigation_job_id) on delete restrict,
  workspace_id uuid not null references public.organizations(id) on delete restrict, collector_key text not null, provider text not null,
  pricing_policy_id uuid not null references public.pricing_policies(pricing_policy_id) on delete restrict, pricing_policy_version integer not null check(pricing_policy_version > 0),
  estimated_cost numeric(20,8) not null check(estimated_cost >= 0), actual_cost numeric(20,8) check(actual_cost >= 0), billable_cost numeric(20,8) not null check(billable_cost >= 0), internal_platform_cost numeric(20,8) not null check(internal_platform_cost >= 0), currency text not null check(currency ~ '^[A-Z]{3}$'),
  status text not null check(status in ('started','completed','failed','cancelled')), started_at timestamptz not null, completed_at timestamptz,
  metadata jsonb not null default '{}', created_at timestamptz not null default now(), check(completed_at is null or completed_at >= started_at), check(status='started' or actual_cost is not null)
);

create table public.cost_ledger_entries (
  cost_entry_id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.collector_executions(execution_id) on delete restrict,
  investigation_id uuid not null references public.investigation_jobs(investigation_job_id) on delete restrict, workspace_id uuid not null references public.organizations(id) on delete restrict,
  pricing_policy_id uuid not null references public.pricing_policies(pricing_policy_id) on delete restrict, pricing_policy_version integer not null,
  provider text, collector_key text not null, cost_source text not null check (cost_source in ('internal_execution','external_provider','ai_model','storage','monitoring_recurring','manual_review')),
  billing_unit text not null check (billing_unit in ('investigation','collector','provider','observation','assertion','monitoring_cycle','api_request')), quantity numeric(20,8) not null check(quantity >= 0),
  estimated_cost numeric(20,8) not null check(estimated_cost >= 0), actual_cost numeric(20,8) check(actual_cost >= 0), billable_cost numeric(20,8) not null check(billable_cost >= 0), internal_platform_cost numeric(20,8) not null check(internal_platform_cost >= 0),
  currency text not null check(currency ~ '^[A-Z]{3}$'), occurred_at timestamptz not null default now(), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index cost_ledger_workspace_period_idx on public.cost_ledger_entries(workspace_id,occurred_at desc);
create index cost_ledger_execution_idx on public.cost_ledger_entries(execution_id);

create table public.workspace_usage_events (
  usage_event_id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.organizations(id) on delete restrict,
  investigation_id uuid references public.investigation_jobs(investigation_job_id) on delete restrict, execution_id uuid references public.collector_executions(execution_id) on delete restrict,
  metric_key text not null, quantity numeric(20,8) not null check(quantity >= 0), unit text not null, cost_entry_id uuid references public.cost_ledger_entries(cost_entry_id) on delete restrict,
  idempotency_key text not null, occurred_at timestamptz not null default now(), metadata jsonb not null default '{}', created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
create index workspace_usage_period_idx on public.workspace_usage_events(workspace_id,occurred_at desc,metric_key);

create table public.subscription_plans (
  plan_version_id uuid primary key default gen_random_uuid(), plan_key text not null, version integer not null default 1 check(version > 0), name text not null, status text not null default 'draft' check(status in ('draft','active','retired')),
  billing_configuration jsonb not null default '{}', created_at timestamptz not null default now(), unique(plan_key,version)
);
create table public.plan_entitlements (
  plan_version_id uuid not null references public.subscription_plans(plan_version_id) on delete cascade, feature_key text not null, enabled boolean not null default true,
  usage_limit numeric(20,8) check(usage_limit is null or usage_limit >= 0), usage_unit text, configuration jsonb not null default '{}', primary key(plan_version_id,feature_key)
);

-- Existing products and grants are retained. This map lets them participate in the generic plan model.
alter table public.product_catalog add column if not exists plan_version_id uuid references public.subscription_plans(plan_version_id);
alter table public.provider_usage_events add column if not exists execution_id uuid references public.collector_executions(execution_id);
alter table public.provider_usage_events add column if not exists billable_cost numeric(20,8) check(billable_cost >= 0);
alter table public.provider_usage_events add column if not exists internal_platform_cost numeric(20,8) check(internal_platform_cost >= 0);
alter table public.provider_usage_events add column if not exists pricing_policy_id uuid references public.pricing_policies(pricing_policy_id);

insert into public.platform_registry_entries(registry_type,registry_key,display_name) values
 ('subject_type','domain','Domain'),('subject_type','website','Website'),('identifier_type','domain','Domain'),('identifier_type','normalized_url','Normalized URL'),
 ('feature','website_intelligence','Website Intelligence'),('feature','marketplace_intelligence','Marketplace Intelligence'),('feature','business_intelligence','Business Intelligence'),
 ('feature','person_intelligence','Person Intelligence'),('feature','monitoring','Monitoring'),('feature','ai_analysis','AI Analysis'),('feature','bulk_investigation','Bulk Investigation'),('feature','api_access','API Access'),
 ('usage_metric','investigation','Investigations'),('usage_metric','monitoring_execution','Monitoring executions'),('usage_metric','ai_usage','AI usage'),('usage_metric','provider_spend','Provider spend'),('usage_metric','storage_usage','Storage usage')
on conflict do nothing;

create or replace view public.workspace_monthly_usage with (security_invoker=true) as
select workspace_id,date_trunc('month',occurred_at) period_start,
 coalesce(sum(quantity) filter(where metric_key='investigation'),0) investigations_used,
 coalesce(sum(quantity) filter(where metric_key='monitoring_execution'),0) monitoring_executions,
 coalesce(sum(quantity) filter(where metric_key='ai_usage'),0) ai_usage,
 coalesce(sum(quantity) filter(where metric_key='provider_spend'),0) provider_spend,
 coalesce(sum(quantity) filter(where metric_key='storage_usage'),0) storage_usage
from public.workspace_usage_events group by workspace_id,date_trunc('month',occurred_at);

alter table public.platform_registry_entries enable row level security; alter table public.pricing_policies enable row level security; alter table public.pricing_policy_rules enable row level security;
alter table public.collector_executions enable row level security; alter table public.cost_ledger_entries enable row level security; alter table public.workspace_usage_events enable row level security;
alter table public.subscription_plans enable row level security; alter table public.plan_entitlements enable row level security;
create policy registry_authenticated_read on public.platform_registry_entries for select to authenticated using(status='active');
create policy pricing_workspace_read on public.pricing_policies for select to authenticated using(status='active');
create policy pricing_rules_workspace_read on public.pricing_policy_rules for select to authenticated using(exists(select 1 from public.pricing_policies p where p.pricing_policy_id=pricing_policy_rules.pricing_policy_id and p.status='active'));
create policy execution_member_read on public.collector_executions for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy cost_member_read on public.cost_ledger_entries for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy workspace_usage_member_read on public.workspace_usage_events for select to authenticated using(workspace_id in(select organization_id from public.organization_memberships where user_id=auth.uid() and status='active'));
create policy plans_authenticated_read on public.subscription_plans for select to authenticated using(status='active');
create policy plan_entitlements_authenticated_read on public.plan_entitlements for select to authenticated using(exists(select 1 from public.subscription_plans p where p.plan_version_id=plan_entitlements.plan_version_id and p.status='active'));

-- Ledger writes remain service-role only. Ledger tables have no update or delete policies.

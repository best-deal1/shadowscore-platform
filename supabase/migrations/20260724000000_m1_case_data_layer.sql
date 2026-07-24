-- M1 case storage builds on the existing profiles table without changing it.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'analyst', 'viewer')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  investigation_id text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'awaiting_input', 'under_review', 'monitoring', 'closed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  owner_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_organization_updated_at_idx on public.cases (organization_id, updated_at desc);
create index if not exists cases_organization_public_id_idx on public.cases (organization_id, public_id);

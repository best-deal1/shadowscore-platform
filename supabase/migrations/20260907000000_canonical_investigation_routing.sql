alter table public.intakes
  add column if not exists submitted_seed text,
  add column if not exists investigation_routing jsonb;

comment on column public.intakes.submitted_seed is 'Immutable seed submitted by the customer before canonical investigation routing.';
comment on column public.intakes.investigation_routing is 'Canonical versioned investigation intent consumed by recovery, provider planning, execution, and report presentation.';

-- Preserve the canonical email seed and routing decision across paid and admin report generation.
alter table public.intakes
  add column if not exists submitted_seed text,
  add column if not exists investigation_routing jsonb;

comment on column public.intakes.submitted_seed is 'Original normalized investigation seed retained independently from account contact email.';
comment on column public.intakes.investigation_routing is 'Canonical EmailInvestigationRouting decision captured at intake.';

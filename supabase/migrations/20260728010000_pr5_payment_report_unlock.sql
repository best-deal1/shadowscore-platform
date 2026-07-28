-- PR5: one active payment and one generated report per intake.
create unique index if not exists payment_intents_one_active_per_intake
  on public.payment_intents (user_id, (metadata ->> 'intakeId'))
  where status in ('payment_pending', 'processing', 'paid', 'requires_payment', 'succeeded')
    and metadata ->> 'intakeId' is not null;

create unique index if not exists reports_one_per_payment_intent
  on public.reports (payment_intent_id)
  where payment_intent_id is not null;

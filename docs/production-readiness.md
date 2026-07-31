# Production readiness

## Release decision

**Ready for Production.** The five code-level production blockers are resolved. Each deployment must pass `npm run validate:release-environment` with its real secrets before it receives traffic.

## Resolved blockers

1. **Durable intake storage:** Authenticated production intakes are written to Supabase. Checkout can retrieve the intake and create its locked report.
2. **Production authentication:** Account creation and sign-in fail closed when Supabase is unavailable. The development account store cannot run in production.
3. **Durable workspace storage:** Workspace reads and intake creation fail closed in production. Production cannot silently use process-local data.
4. **Authenticated processing:** The release gate requires the Supabase service role and a strong Investigation worker secret. The worker already rejects requests without its bearer secret.
5. **Verified payment completion:** The release gate derives its credential requirements from the enabled payment provider configuration. Payment completion verifies the transaction status, invoice, recipient, currency, and amount before report generation.

## Automated validation

`npm run validate:production` checks the release contract, report contract, reasoning boundary, business intelligence, platform capabilities, decision integrity, browser boundary, accessibility, intake integrity, translations, rendered translations, and lint.

`npm run validate:release-environment` validates the deployment configuration. It requires an HTTPS Supabase URL, Supabase client and service credentials, the Investigation worker secret, the shared payment callback secret, and the credentials declared for every enabled payment provider. The current PayPal provider requires `PAYMENT_PROVIDER_PAYPAL_PDT_TOKEN`. Secret values remain in the deployment environment and are never committed.

## Deployment checklist

1. Apply every migration in `supabase/migrations` to the production project.
2. Configure all values checked by `npm run validate:release-environment`.
3. Run `npm run validate:release-environment` in the release environment.
4. Run `npm run build` for the exact commit being deployed.
5. Complete the production acceptance validation below.

## End-to-end production validation

Validate the complete customer journey for every supported payment method.

### Payment methods

- [ ] PayPal
- [ ] Credit card
- [ ] Payoneer
- [ ] Bank transfer
- [ ] Every additional enabled provider

Only enabled payment methods are release blockers. Keep the full list in the acceptance plan so each method is covered when enabled.

### Journey checks

For each enabled payment method, verify:

1. The Investigation is created successfully.
2. The checkout session is created.
3. Payment completes.
4. The payment callback or webhook is processed.
5. Payment status is persisted.
6. The Investigation starts automatically.
7. The Executive Report is generated.
8. The Executive Report is accessible.
9. The Investigation appears in Archive.
10. The journey recovers after a refresh or browser restart.
11. Duplicate payments are prevented.
12. The customer can recover from a failed payment.
13. The refund flow completes where the provider supports refunds.

### Issue record

For every issue, record:

- Expected behavior
- Actual behavior
- Root cause
- Fix
- Regression test

### Acceptance goal

A first-time customer can complete the full Investigation and payment journey with any enabled payment method, without manual intervention.

# Production readiness

## Release decision

**Ready for Production.** The five code-level production blockers are resolved. Each deployment must pass `npm run validate:release-environment` with its real secrets before it receives traffic.

## Resolved blockers

1. **Durable intake storage:** Authenticated production intakes are written to Supabase. Checkout can retrieve the intake and create its locked report.
2. **Production authentication:** Account creation and sign-in fail closed when Supabase is unavailable. The development account store cannot run in production.
3. **Durable workspace storage:** Workspace reads and intake creation fail closed in production. Production cannot silently use process-local data.
4. **Authenticated processing:** The release gate requires the Supabase service role and a strong Investigation worker secret. The worker already rejects requests without its bearer secret.
5. **Verified payment completion:** The release gate requires PayPal PDT and payment callback secrets. Payment completion verifies the transaction status, invoice, recipient, currency, and amount before report generation.

## Automated validation

`npm run validate:production` checks the release contract, report contract, reasoning boundary, business intelligence, platform capabilities, decision integrity, browser boundary, accessibility, intake integrity, translations, rendered translations, and lint.

`npm run validate:release-environment` validates the deployment configuration. It requires an HTTPS Supabase URL, Supabase client and service credentials, the Investigation worker secret, and both payment verification secrets. Secret values remain in the deployment environment and are never committed.

## Deployment checklist

1. Apply every migration in `supabase/migrations` to the production project.
2. Configure all values checked by `npm run validate:release-environment`.
3. Run `npm run validate:release-environment` in the release environment.
4. Run `npm run build` for the exact commit being deployed.
5. Complete one real PayPal purchase. Confirm that the intake persists, the payment unlocks one report, the worker finishes the Investigation, and the report remains available after a new sign-in.

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

## Production environment variables

Add the following values to the Vercel project under **Settings > Environment Variables**. Select the **Production** environment for every value. Preview and Development values are separate and do not configure Production. Redeploy the production commit after saving a new or changed value.

| Variable | Required | Source | Handling |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | The production Supabase project's API URL. Copy the project URL from the Supabase project's API settings. | This value is included in the browser bundle. Use the production project URL and include `https://`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | The production Supabase project's client key. Supabase may label it as the anon key or publishable key in the API settings. | This value is included in the browser bundle. Use the client key, not the service role key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | The production Supabase project's server-side service role key from the API settings. | Secret. Add it only to Vercel. Never expose it in a `NEXT_PUBLIC_` variable or commit it. |
| `INVESTIGATION_WORKER_SECRET` | Yes | Generate a random value with at least 32 characters, for example with `openssl rand -hex 32`. | Secret. Use the same value in Vercel and in the scheduler's bearer authorization header. This value does not come from Supabase. |
| `PAYMENT_CALLBACK_SECRET` | Yes | Generate a separate random value with at least 32 characters, for example with `openssl rand -hex 32`. | Secret. Give this value only to the trusted service that calls the payment callback route. This value does not come from PayPal. |
| `PAYMENT_PROVIDER_PAYPAL_PDT_TOKEN` | Yes while PayPal is enabled | The Payment Data Transfer identity token for the PayPal business account that receives production payments. Enable Payment Data Transfer in that account and copy its identity token. | Secret. This is an identity token, not a PayPal client secret, webhook ID, or transaction ID. |

`NEXT_PUBLIC_ADMIN_EMAILS` is optional. It is a comma-separated admin allowlist and does not configure storage, processing, or payment verification. `INVESTIGATION_WORKER_ID` is also optional. It labels a worker deployment and defaults to `next-worker`.

The PayPal receiver address is currently configured in `lib/config.ts` as `PAYPAL_BUSINESS_EMAIL`. Confirm that this address is verified on the same PayPal business account that issued the PDT token before accepting payments.

The message `Persistent workspace storage is not configured.` means the deployed production function cannot read both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Adding variables to a different Vercel environment or saving them without redeploying does not update the running production deployment.

## Deployment checklist

1. Create or select the production Supabase project.
2. Apply every migration in `supabase/migrations` to that project, in filename order.
3. Copy the Supabase project URL, client key, and service role key into the matching Vercel Production variables above.
4. Generate separate values for `INVESTIGATION_WORKER_SECRET` and `PAYMENT_CALLBACK_SECRET`. Store them in Vercel Production and in each trusted caller that needs the corresponding secret.
5. Enable PayPal Payment Data Transfer. Add its identity token as `PAYMENT_PROVIDER_PAYPAL_PDT_TOKEN`, then verify that `PAYPAL_BUSINESS_EMAIL` belongs to that PayPal account.
6. Confirm that all six required variables are assigned to Production. `NEXT_PUBLIC_ADMIN_EMAILS` alone is not a valid production configuration.
7. Configure a scheduler to send `POST /api/internal/investigation-worker` with `Authorization: Bearer <INVESTIGATION_WORKER_SECRET>` at least once per minute.
8. Redeploy the exact production commit so the deployment receives the saved values.
9. Run `npm run validate:release-environment` with the production environment loaded. Do not print the secret values in build logs.
10. Run `npm run build` for the exact commit being deployed.
11. Complete the production acceptance validation below.

No application code change is required to resolve missing production environment variables. Consider code changes only if the checklist passes on the active deployment and the application still reports a configuration error. In that case, capture the failing route, deployment identifier, and sanitized logs before changing code.

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

# Journey Status

Audit date: 2026-07-29

## Customer journey

| Step | Status | Verification |
| --- | --- | --- |
| Landing page | ✅ | `/` renders and the investigation call to action links to `/intake`. |
| Start investigation | ✅ | The intake form validates the target and calls the free preview API. |
| Enter target | ✅ | Website, marketplace, and evidence targets have validation and visible errors. |
| Preview generation | ✅ | `/api/free-scan/providers` returns an explicit ready state. Failures leave the loading state and show an error. |
| Save investigation | ✅ | Authenticated users create an intake. Guest drafts are saved before signup and restored after authentication. |
| Unlock full report | ✅ | A saved intake creates one payment intent and opens the canonical unlock route. |
| Login or signup | ✅ | Both forms preserve a validated local return route. Signup returns to the saved investigation. |
| Return to investigation | ✅ | The checkout draft is restored from session storage and converted to an account intake. |
| Payment page | ✅ | The unlock page shows the target, product contents, final price, timing, and legal terms. |
| Successful payment | ✅ | The PayPal return transaction is verified server-side with PDT. Recipient, status, invoice, currency, and amount must match before access changes. |
| Report generation | ✅ | Verified payment starts idempotent server-side generation. Refreshes only read status. |
| Full report display | ✅ | The report route requires both paid and ready states. |
| Start monitoring | ✅ | The full report action navigates to the authenticated monitoring workspace with the report reference. |

## Bugs

### Critical

1. **Guest checkout could not start. Fixed.** Saving before authentication only wrote a preview lead. It did not create an intake, so the unlock button stayed disabled. The flow now saves a checkout draft, sends the user to signup, restores the investigation, and creates the intake.
2. **A PayPal return could wait forever. Fixed.** The return route previously polled for a status that no customer-facing flow updated. The processing page now submits the PayPal transaction ID to a server route. That route verifies the transaction with PayPal before marking payment as paid and generating the report.

### High

1. **Payment completion was not tied to the purchased report. Fixed.** Payment confirmation now checks the payment status, invoice, receiver, currency, and exact amount before report generation.
2. **Authentication lost the active purchase context. Fixed.** The signup and login round trip now returns to a restorable checkout draft instead of an unusable intake URL.

### Medium

1. Monitoring currently opens the existing monitoring workspace. Monitor persistence remains tied to the workspace implementation and deployment data store.
2. Existing dashboard filter controls are presentation-only. They are outside the purchase and report-reading path.

### Low

1. The production lint run reports existing image optimization and unused-variable warnings. It reports no lint errors.

## Production configuration required

Set `PAYPAL_PDT_IDENTITY_TOKEN` to the identity token from the PayPal account that receives payments. Confirm that `PAYPAL_BUSINESS_EMAIL` is the verified receiver email for that account. Checkout stays locked if server-side payment verification is not configured.

# ShadowScore V22 Report Pipeline

## Payment flow

1. A user runs a free scan from intake.
2. The app creates an intake record with `reportStatus = preview` and `paymentStatus = payment_pending`.
3. Checkout creates only a payment intent, legal acceptance, and locked report placeholder.
4. A report can be generated only after the payment intent reaches `paymentStatus = paid`.

## Intake lifecycle

- `preview`: free scan has captured scan mode, target, provider slots, and visible signal categories.
- `payment_pending`: checkout has started and the report remains locked.
- Intake records are the durable input to the report pipeline and are designed for Supabase persistence.

## Payment intent lifecycle

Supported payment statuses are:

- `payment_pending`
- `processing`
- `paid`
- `failed`
- `refunded`

Browser state never unlocks a report. The unlock condition is only `paymentStatus == paid`.

## Report lifecycle

Supported report statuses are:

- `preview`
- `payment_pending`
- `generating`
- `ready`
- `failed`

Checkout never creates a completed report. It creates a locked placeholder. The generation service moves a paid report through `generating` to `ready`.

## Generation service

`lib/reportPipeline.ts` owns report generation. It:

- accepts intake data
- accepts payment intent data
- verifies `paymentStatus == paid`
- executes placeholder providers
- passes structured provider context to the risk engine
- builds the report object
- returns a ready report for workspace storage

Placeholder providers return only structured placeholder results. They do not hardcode fake scores or fake intelligence.

## Unlock logic

The service exposes `canGenerateReport(paymentIntent)`. It returns true only for `paymentStatus === "paid"`. All full-report UI states should use `reportStatus === "ready"`.

## Dashboard states

The dashboard displays lifecycle states:

- Preview created
- Waiting for payment
- Generating report
- Report ready
- Failed

When `reportStatus === "ready"`, the dashboard shows View Report and a Download Report placeholder. Otherwise download and full report details remain hidden.

## Future PDF generation

The current Download Report control is a placeholder. Future PDF generation should consume the stored report object and render a reproducible PDF snapshot using the saved engine version, provider versions, provider results, evidence summary, and report summary.

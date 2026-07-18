# Commercial Readiness Audit: Sprint 1 End-to-End Customer Journey

Date: 2026-07-10  
Scope: Customer experience and commercial readiness only. Decision Engine, Ontology, Knowledge Graph, Investigation, and Providers were reviewed only as route dependencies where necessary and were not modified.

## Executive Summary

ShadowScore has the foundation of a commercial journey: a clear landing-page promise, an investigation preview, legal-gated checkout, payment-intent creation, locked report placeholders, paid report generation, report viewing, account access, workspace history, and monitoring watchlists.

The product is **commercially promising but not yet fully production-ready**. The biggest readiness gaps are not in the core intelligence flow; they are in commercial clarity and operational completeness:

1. Pricing is not canonical. `/upgrade` exists as a paid-plan page, but there is no single canonical `/pricing` route and multiple prices appear across the experience.
2. Checkout is a modal embedded inside scan and upgrade contexts, not a complete checkout route with first-class retry, cancel, pending, failed, success, and receipt states.
3. Payment status modeling is incomplete relative to the requested states: unknown, pending, succeeded, failed, cancelled, refunded.
4. Billing is not implemented as a customer-facing surface. The workspace has legal acceptances and payment intents in storage, but no billing page with invoices, payment history, credits, subscriptions, or current plan detail.
5. Report ownership is partially satisfied in memory-mode paid report generation, but Supabase report mapping does not expose `userId` back onto report records, which weakens ownership visibility in the UI.
6. Workspace is useful but overloaded. It serves as dashboard, reports, investigations, report history, activity, account summary, and watchlist management. Dedicated report history, billing, and saved-business surfaces are thin or aliases.
7. Empty states exist, but they are mostly functional rather than premium conversion states.

Overall readiness score: **66 / 100**.

## Journey Map Assessment

Expected journey:

Landing → Investigation → Preview → Save Investigation → Pricing → Checkout → Payment → Generating Report → Ready Report → Report History → Workspace → Monitoring

Current implementation status:

| Step | Status | Evidence | Commercial assessment |
| --- | --- | --- | --- |
| Landing | Strong foundation | `/` has a hero, target input, outcome cards, value-proposition cards, and start CTA. | Clear, but lacks explicit free-vs-paid explanation above the fold and trust indicators could be stronger. |
| Investigation | Present | Landing sends users to `/intake`; intake runs a free preview and exposes preview results. | Good flow, although some wording still says scan/technical details. |
| Preview | Present | Preview marks report locked and says full evidence unlocks after payment. | Needs stronger buyer education: what is free, what is locked, and why payment is required. |
| Save Investigation | Partial | Intake has “Save Report” and creates an intake with `reportStatus=preview`. | CTA should say “Save Investigation” to match lifecycle and avoid implying report ownership before payment. |
| Pricing | Partial | `/upgrade` describes Professional Plan and `$49`; intake sells report unlock for `$9.90`. | No canonical pricing page; duplicate/inconsistent commercial offers. |
| Checkout | Partial | Payment modal supports legal acceptance and PayPal/Card/Payoneer/Bank Transfer. | Missing full-page checkout, failure states, retry/cancel/pending/success flows, and receipt/return handling. |
| Payment | Partial | Payment intents can be created and dev webhook can mark paid. | State model is narrower than required and real payment confirmation is not complete. |
| Generating Report | Partial | API can mark paid and generate report. | UI does not clearly show customer-facing generating state after external payment return. |
| Ready Report | Present | `/report?reportId=` renders ready reports only. | Good gated report viewing, but lacks download controls and ownership labels. |
| Report History | Partial | Dashboard lifecycle and `/reports` alias exist. | `/reports` aliases dashboard, so report history is not dedicated. |
| Workspace | Present | Dashboard contains reports, lifecycle, watchlist, account, activity. | Strong base, but information architecture needs separation and premium empty states. |
| Monitoring | Present | `/monitoring` lists watchlist entries and metrics. | Good early monitoring surface; plan/paid entitlement is unclear. |

## 1. Landing

### Current strengths

- The hero explains the core customer job: investigate a digital business identity before proceeding.
- Primary CTA is prominent: “Start Investigation”.
- The target input supports website, company, email, phone, and marketplace seller identities.
- Outcome language is more business-facing than technical: PASS, REVIEW, CONFIRMED RISK.
- Value proposition is organized around verified signals, evidence gaps, and confirmed risks.

### Gaps

- The landing page does not explain pricing or “free preview vs paid report” near the first CTA.
- Trust indicators are product claims, not commercial confidence builders. Missing examples: secure checkout, legal disclaimer, report ownership, no guarantee statement near CTA, supported payment methods, customer-safe data handling, sample report link.
- CTA hierarchy is simple but incomplete. There is no secondary CTA such as “View sample report” or “See pricing”.
- “Start Investigation” is clear, but users may not know whether starting is free.

### Recommendation

Add a compact above-the-fold trust/commercial strip:

- Free preview before payment
- Paid report only after legal acceptance
- PayPal, card, Payoneer, bank transfer
- Reports saved to your workspace
- Sample report available

Recommended CTA hierarchy:

1. Primary: **Start Free Preview**
2. Secondary: **View Sample Report**
3. Tertiary: **See Pricing**

## 2. Preview

### Current strengths

- The preview clearly states that the report is locked and generated only after payment succeeds.
- The preview exposes useful customer-facing information: decision, recommendation, identity summary, evidence summary, and next steps.
- Payment is introduced at the moment of value realization.

### Gaps

- The preview does not explicitly enumerate “included for free” vs “locked in the paid report” in a structured comparison.
- “Technical Details” is exposed in the preview; this is useful for internal validation but can weaken business clarity.
- “Save Report” appears before payment even though the action saves an intake/preview, not a paid report.
- The post-save message says “Checkout will create a payment intent and locked placeholder only,” which is implementation wording.

### Recommendation

Replace the preview conversion block with business copy:

**Free Preview includes**
- Initial identity signal summary
- PASS / REVIEW / CONFIRMED RISK preview
- Top evidence gaps
- High-level recommended action

**Professional Report unlocks**
- Full evidence hierarchy
- Complete scoring breakdown
- Provider/evidence trail
- Downloadable report
- Workspace history
- Monitoring-ready saved business

**Why payment is required**
- Payment funds the full report generation, evidence organization, saved workspace ownership, and downloadable output.

CTA changes:

- “Save Report” → **Save Investigation**
- “Unlock Full Report - $9.90” → **Unlock Professional Report: $9.90**
- “Technical Details” → **Evidence details** or hide behind “For advanced users”.

## 3. Pricing

### Current strengths

- `/upgrade` explains that payment turns a one-time scan into a usable workspace.
- The upgrade page lists valuable paid features: saved history, downloadable reports, summaries, monitoring, account-level organization.
- The intake page has a clear low-friction report unlock price.

### Gaps

- There is no canonical `/pricing` route.
- Pricing is duplicated and inconsistent: `$9.90` for a downloadable report in intake and `$49` for “ShadowScore Professional” in upgrade.
- Navigation points to upgrade/start flows but not a clearly named pricing destination.
- Future plans are not explained.
- Monitoring is described as available after payment but not clearly priced or bundled.

### Recommendation

Create one canonical pricing model and route in a future code sprint:

**Free Preview: $0**
- Run investigation preview
- See high-level decision preview
- Save investigation draft/preview

**Professional Report: $9.90 per report**
- Full evidence-backed report
- Downloadable report
- Saved to workspace
- Report history

**Monitoring: planned / waitlist or monthly plan**
- Watch saved businesses
- Track marketplace/payment/supplier changes
- Receive monitoring alerts when enabled

**Future plans**
- Team workspace
- API access
- Bulk monitoring
- Enterprise review workflows

Commercial decision needed: either keep `$9.90/report` as the canonical paid product and make `$49` a future/monthly Professional tier, or remove `$49` until subscription features are real.

## 4. Checkout

### Current strengths

- Checkout requires legal acceptance before payment buttons activate.
- Payment methods are visible: PayPal, credit card, Payoneer, and bank transfer.
- PayPal opens a direct PayPal checkout URL.
- Card, Payoneer, and bank transfer open WhatsApp for manual secure payment coordination.
- A checkout intent and legal acceptance are recorded when a signed-in session exists.

### Gaps

- Checkout is modal-based, not a robust route with deep-linkable states.
- If there is no current session, the user can still open external payment options but no workspace checkout intent is persisted.
- There is no visible retry state after payment failure.
- Cancel is only modal close, not a payment-cancel lifecycle state.
- Pending is explained only indirectly.
- Success depends on manual/dev webhook behavior, not payment return confirmation.
- Failure and pending states are not represented in customer-facing UI.
- No receipt, order summary, invoice number, or “what happens next” page after payment.

### Recommendation

Future checkout route/state model:

- `/checkout?intakeId=...&plan=professional-report`
- `/checkout/pending?paymentIntentId=...`
- `/checkout/success?paymentIntentId=...`
- `/checkout/failed?paymentIntentId=...`
- `/checkout/cancelled?paymentIntentId=...`

Required customer copy by state:

- **Pending:** “We are confirming your payment. Your report will start generating when confirmation arrives.”
- **Succeeded:** “Payment confirmed. Your report is generating now.”
- **Failed:** “Payment was not completed. Retry or choose another method.”
- **Cancelled:** “Checkout was cancelled. Your free preview is still saved.”
- **Refunded:** “This payment was refunded. Report access may be removed or marked refunded according to policy.”

## 5. Payment

### Current strengths

- Payment intent records exist.
- Legal acceptance records exist.
- Report generation is gated by paid payment status.
- Locked report placeholders are created after checkout for saved intakes.

### Required states vs current states

Requested states:

- Unknown
- Pending
- Succeeded
- Failed
- Cancelled
- Refunded

Current model:

- `payment_pending`
- `processing`
- `paid`
- `failed`
- `refunded`

### Gaps

- No explicit `unknown` state.
- No explicit `cancelled` state.
- `paid` should map to business-facing “succeeded” or UI copy should consistently render “Paid”.
- Supabase mapping casts raw statuses into the narrower type and may pass unsupported statuses through without a complete UI treatment.
- Payment methods opened through WhatsApp are manual and do not have clear verification state transitions.

### Recommendation

Keep internal values if desired, but introduce a customer-facing payment-status display map:

| Internal | Customer label | Customer action |
| --- | --- | --- |
| unknown | Payment status unknown | Contact support / refresh |
| payment_pending | Payment pending | Wait or choose another method |
| processing | Payment processing | Report will generate after confirmation |
| paid | Payment succeeded | Generate/open report |
| failed | Payment failed | Retry checkout |
| cancelled | Payment cancelled | Resume checkout |
| refunded | Refunded | View billing record / support |

## 6. Report Ownership

### Current strengths

- Memory-mode locked placeholders and generated reports include `userId`.
- Reports are loaded through the current workspace session.
- Ready reports are gated: non-ready reports do not display full details or downloads.
- Report IDs and lifecycle states are shown in the dashboard.

### Gaps

- Supabase report mapping does not include `userId` in the report object returned to the UI.
- There is no clear “Owned Reports” label in the product navigation or workspace.
- There is no dedicated “Unlocked Reports” section separate from lifecycle records.
- Downloads are mentioned but not implemented in the report UI.
- `/reports` is only an alias to dashboard, so report history is not a dedicated center.

### Recommendation

Create a dedicated Reports center in a future sprint:

- Owned Reports
- Unlocked Reports
- Locked/Pending Reports
- Downloads
- History
- Receipts/invoices linked to reports

Report cards should show:

- Owner email or workspace name
- Payment status
- Report status
- Download availability
- Created date / ready date
- Original investigation target

## 7. Workspace

### Current strengths

- Workspace/dashboard includes user identity, plan label, ready report count, average risk, high risk count, acceptances, saved reports, lifecycle, watchlist, latest activity, and workspace data note.
- Monitoring watchlist can be managed from the dashboard.
- Account settings are accessible.

### Gaps

- `workspace`, `reports`, and `investigations` routes alias other pages instead of providing clear dedicated experiences.
- Recent Investigations are not first-class; the dashboard focuses on ready reports and lifecycle report records.
- Saved Businesses are represented as watchlist entities, but not labeled as a saved-business library.
- Account and billing are not integrated beyond a simple account settings link and plan label.
- Plan label is inferred from ready reports, which is not robust for subscriptions or refunded reports.

### Recommendation

Workspace information architecture:

- Overview
- Investigations
- Reports
- Saved Businesses
- Monitoring
- Billing
- Account

Each module should have a premium empty state and a clear next CTA.

## 8. Billing

### Current strengths

- Payment intents and legal acceptances are stored in workspace data.
- The dashboard has an “Acceptances” metric.
- Checkout captures plan name, price, method, legal version, and timestamp.

### Gaps

- No billing page.
- No invoice list.
- No payment history page.
- No credits concept.
- No subscription UI.
- No current plan detail beyond inferred “Free” or “Professional”.
- No customer-facing receipt after payment.

### Recommendation

Future `/billing` page sections:

- Current plan
- Report purchases
- Invoices / receipts
- Payment history
- Credits
- Subscriptions
- Legal acceptances
- Refund status

Billing empty state:

> No billing history yet. Run a free preview first, then unlock a Professional Report when you need the full evidence-backed analysis.

## 9. Empty States

### Current strengths

- Empty states exist for no paid reports, no lifecycle records, empty watchlist, empty timeline, and no monitored businesses.
- Empty states do not use fake demo data, which is a strong trust choice.

### Gaps

- Empty states are plain and mostly descriptive.
- They do not consistently explain value, next step, and expected outcome.
- Billing empty state is missing.
- No dedicated empty state for no investigations because `/investigations` aliases intake.
- No dedicated empty state for no reports because `/reports` aliases dashboard.

### Recommended premium empty states

**No investigations**

> Start with a free investigation preview. You will see the initial decision, evidence gaps, and whether a full report is worth unlocking.

CTA: **Start Free Preview**

**No reports**

> You have no unlocked reports yet. Unlock a Professional Report after preview to save the full evidence-backed analysis to your workspace.

CTA: **Run Investigation**

**No monitoring**

> Monitoring starts when you save businesses, marketplaces, payment providers, suppliers, or websites to your watchlist.

CTA: **Add Business to Monitoring**

**No billing**

> Billing history appears after your first Professional Report purchase or monitoring subscription.

CTA: **View Pricing**

## 10. Product Copy

### Strong current copy

- “Start Investigation”
- “Evidence supports proceeding”
- “Additional verification recommended”
- “Verified negative indicators detected”
- “Full Report Unlock”
- “Payment unlocks the full ShadowScore report…”

### Copy to change

| Current | Recommended | Reason |
| --- | --- | --- |
| New Scan | New Investigation | Aligns with product language. |
| Recent scans | Recent Investigations | Business wording. |
| Save Report | Save Investigation | Avoids promising report ownership before payment. |
| Full Report Unlock | Professional Report | More commercial and less mechanical. |
| Unlock Full Report - $9.90 | Unlock Professional Report: $9.90 | Clearer paid product. |
| Dev webhook: mark paid and generate | Remove from production UI | Internal tooling should not be customer visible. |
| Payment: paid/payment_pending | Payment succeeded / Payment pending | Customer-facing labels. |
| reportStatus=preview | Preview saved | Avoid implementation wording. |
| Technical Details | Evidence Details | Less engineering-oriented. |
| Add Entity | Add Business | More business-facing. |

## 11. Commercial Readiness Score

| Area | Score | Rationale |
| --- | ---: | --- |
| Landing | 78 / 100 | Strong hero and CTA; missing explicit free/paid explanation, trust strip, sample report/pricing CTA. |
| Pricing | 42 / 100 | Upgrade page exists, but no canonical pricing and duplicate/inconsistent prices. |
| Checkout | 58 / 100 | Legal-gated payment modal works conceptually; missing dedicated stateful checkout, retry/cancel/success/failure pages. |
| Billing | 25 / 100 | Payment records exist internally; no customer billing page or invoices. |
| Workspace | 72 / 100 | Good workspace base; overloaded dashboard and aliased routes reduce clarity. |
| Account | 55 / 100 | Basic account exists; no billing, security, plan management, or production account controls. |
| Report ownership | 68 / 100 | User-owned records exist in memory mode and reports are gated; missing dedicated ownership UI/downloads and Supabase userId mapping. |
| Overall readiness | 66 / 100 | Commercial lifecycle is present but not yet canonical, stateful, or complete enough for production-grade purchase confidence. |

## 12. Acceptance Criteria Review

A first-time customer must understand the following:

| Requirement | Current result | Pass? |
| --- | --- | --- |
| What ShadowScore does | Landing explains digital business identity intelligence and evidence-backed recommendations. | Yes |
| What they get for free | Preview is implied but not structured. | Partial |
| What they pay for | Full report unlock is explained; pricing is inconsistent. | Partial |
| How they pay | Checkout lists PayPal, card, Payoneer, bank transfer. | Yes |
| What happens after payment | Some copy says the report generates after payment, but no robust success/generating return flow. | Partial |
| Where their reports are stored | Workspace/dashboard copy says saved reports and history are organized there. | Yes |
| How to return later | Login/workspace/account exist; report history route is not dedicated. | Partial |

## Prioritized Sprint 2 Recommendations

1. Create canonical `/pricing` and remove/redirect duplicate pricing surfaces.
2. Decide canonical commercial package names and prices.
3. Create dedicated checkout status pages for pending, success, failed, cancelled, and refunded.
4. Add billing page with current plan, invoices, payment history, credits, subscriptions, and legal acceptances.
5. Replace scan/report copy with investigation/professional-report business language.
6. Create dedicated `/reports` center and stop aliasing it to dashboard.
7. Create dedicated `/investigations` history and stop aliasing it to intake.
8. Add report ownership labels, downloads section, and unlocked/locked report groupings.
9. Add premium empty states for investigations, reports, monitoring, and billing.
10. Remove dev webhook actions from customer-facing production UI.

## Final Verdict

ShadowScore is close to a complete commercial product path, but the current experience still feels like a strong prototype with revenue hooks rather than a fully coherent commercial journey. The highest-impact fixes are commercial information architecture, canonical pricing, checkout/payment states, billing, and report ownership presentation. Once those are in place, the core journey from first visit to owned report should be understandable for a first-time buyer.

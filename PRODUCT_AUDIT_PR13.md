# PR13 Product Audit

Date: 2026-07-29

## Product standard

ShadowScore should lead each user to a decision, explain the supporting evidence, and present one clear next action. Commercial claims must describe the product that a customer can use today.

## Critical

### Publish one accurate price

**Finding:** The product offered a $9.90 report in checkout while the pricing page advertised monthly plans from $49 to $199. Several plan capabilities, including team workspaces, API access, webhooks, SSO, and subscriptions, were not part of the current purchase flow.

**Action:** Use `/pricing` as the canonical pricing route. Present the free preview and the $9.90 one-time report. Label monitoring as Coming Soon. Remove unimplemented subscription claims.

**Benefit:** Customers can understand the purchase before checkout. The product no longer makes conflicting commercial promises.

### Keep checkout connected to the preview

**Finding:** The free preview and report unlock form the strongest implemented commercial journey. Subscription and enterprise calls to action diverted users into flows without matching fulfillment.

**Action:** Keep the primary journey as free preview, full report unlock, processing, report, and workspace. Treat other offers as future work until fulfillment and account states exist.

**Benefit:** Every commercial action has a complete outcome.

## High Impact

### Reduce public navigation choices

**Finding:** The main navigation showed nine destinations, including operational pages such as Watchlist and Alerts. Several destinations represented overlapping ways to start a check.

**Action:** Limit public navigation to Product, Sample report, Methodology, Pricing, and Security. Keep the investigation action visually primary. Keep account and operational destinations inside authenticated workspace navigation.

**Benefit:** Visitors can identify the product, proof, price, and trust information without sorting through internal tools.

### Make the homepage set purchase expectations

**Finding:** The homepage explained the investigation workflow but did not state that the preview is free or show the report price near the primary action.

**Action:** Use “Start free preview” as the primary action. Add sample report and pricing paths. State the report price and workspace outcome beside the action.

**Benefit:** Users know the cost and sequence before entering the investigation.

### Use one public shell

**Finding:** The homepage had a standalone footer and no shared public navigation, while downstream pages used the application shell.

**Action:** Place the homepage in the shared public shell.

**Benefit:** The first page and downstream journey now share navigation, trust links, language controls, and account access.

## Medium Impact

### Consolidate workspace entry points

Unify `/dashboard`, `/workspace`, `/reports`, `/watchlist`, and `/alerts` under one authenticated information architecture. The first workspace screen should prioritize current alerts, recent investigations, pending actions, monitoring, and saved work. Preserve old routes with redirects only after role and authentication behavior is verified.

### Standardize lifecycle states

Create one customer-facing vocabulary for preview, checkout, payment pending, processing, ready, failed, cancelled, and refunded. Use the same labels in the investigation, report, and workspace surfaces. Add route-level loading and error states to every dynamic commercial step.

### Refine the executive report hierarchy

Keep the first viewport limited to the trust decision, its main reasons, and the recommended next action. Move evidence detail, provider diagnostics, and methodology below that summary or behind progressive disclosure.

### Complete accessibility verification

Test mobile menu focus return, active navigation states, checkout keyboard flow, dialog focus containment, report heading order, reduced motion, and 200% zoom. Add automated coverage where the current accessibility validator does not exercise interaction.

## Low Priority

### Visual polish after consolidation

Standardize the remaining legacy red, violet, sky, and slate treatments after routes and component ownership are consolidated. Avoid a broad reskin before the information architecture is stable.

### Performance measurement

Capture production Core Web Vitals for the homepage, intake, preview, checkout, report, and workspace. Prioritize measured image, JavaScript, and layout stability problems instead of speculative optimization.

## Implemented in PR13

1. Canonical and implementation-accurate pricing.
2. Redirect from the legacy upgrade route.
3. Simplified public navigation.
4. Shared homepage shell.
5. Clear homepage price and journey expectations.

## Deferred deliberately

Workspace route consolidation, payment lifecycle expansion, report restructuring, and broad visual standardization require deeper flow-specific validation. They should be delivered as small follow-up changes with acceptance tests. No new provider, AI, integration, or backend capability is recommended for those changes.

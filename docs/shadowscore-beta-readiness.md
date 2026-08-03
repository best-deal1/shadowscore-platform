# ShadowScore Beta Readiness

**Product audit date:** 2026-08-03
**Scope:** Product, UX, UI, content, legal presentation, authentication, investigations, reports, monitoring, alerts, archive, administration, payment experience, navigation, and responsive behavior.
**Decision:** **Not ready for a commercial beta.** The core workspace is operational, but the product still exposes parallel generations of the experience, demonstration data in customer surfaces, an incomplete purchase handoff, and legal and trust content that is too general for a paid SaaS service.

## 1. Executive assessment

ShadowScore has the foundations of a credible investigation product. It has a consistent dark visual direction, a public shell, an authenticated shell, clear evidence concepts, an Executive Report, authenticated session protection, and dedicated loading and error boundaries on important workspace routes.

The main polish problem is not the quality of individual cards or gradients. It is product coherence. A customer can encounter several names, route families, visual systems, record models, report examples, monitoring implementations, and operational demonstrations. The public offer has also expanded from one $9.90 investigation to four plans, while the intake and checkout path still behaves as a single report purchase. This makes the product appear broader than the customer experience can currently support.

The beta should focus on one dependable story:

> Enter one Business, review the scope, purchase one Investigation, and receive one Executive Report in your workspace.

Monitoring can remain visible only if it uses customer data and has an explicit beta status. Internal engines, quality tools, runtime consoles, and demonstration products should not be discoverable customer destinations.

### Readiness scorecard

| Area | Score | Assessment |
| --- | ---: | --- |
| Product coherence | 2/5 | The canonical workspace is clearer, but parallel routes and product models remain. |
| Visual system | 3/5 | Strong baseline, with competing red, violet, emerald, and blue accents and several bespoke page systems. |
| Navigation | 2/5 | Public and workspace shells exist, but duplicate destinations and missing account context create uncertainty. |
| Investigation journey | 3/5 | Intake is capable and detailed, but too dense and weakly connected to the paid handoff. |
| Reports and archive | 3/5 | A report contract and distinct libraries exist, but report naming, examples, retrieval, and sharing are fragmented. |
| Authentication | 3/5 | Sign-in, sign-up, return paths, and server sign-out exist. Password recovery and account lifecycle are missing. |
| Payments | 1/5 | Checkout creates an intent, but the visible component returns to the workspace without presenting a provider selection or complete payment journey. |
| Monitoring and alerts | 1/5 | Canonical workspace monitoring is populated by demonstration records. Other watchlist and alert routes use a separate product model. |
| Legal and trust | 2/5 | Terms, Privacy, and Security exist, but omit commercial details required for informed purchase and enterprise review. |
| Accessibility | 3/5 | Skip links, labels, landmarks, and focus treatments are present. Full keyboard, screen-reader, contrast, and reflow review is still required. |
| Mobile readiness | 2/5 | Responsive primitives exist, but dense tables, report layouts, intake, side navigation, and admin views need device testing. |

## 2. Audit method and limits

This is a repository-level product audit. It reviewed every page under `app/`, shared shells and product components, route relationships, copy sources, authentication calls, pricing data, payment entry points, empty and asynchronous states, and existing product audits. It does not certify live PayPal behavior, external provider behavior, production data, legal compliance, browser compatibility, assistive technology behavior, or performance on a deployed environment.

The visual findings are based on the rendered structure and styling code. Before implementation begins, the team should capture the screenshot set in section 13 at desktop and mobile sizes. Those captures are the baseline for visual acceptance.

## 3. Critical issues

### C1. Customer monitoring displays demonstration data

`/workspace/monitoring` and its entity timeline import demo entities, snapshots, and alerts directly. The workspace overview widget does the same. These screens are inside the authenticated shell and present the data as current account activity.

**Impact:** A beta customer can interpret fictional entities, scores, and alerts as their own records. This is a product-integrity and trust failure.

**Required outcome:** Customer routes show durable tenant-scoped monitoring data or a clearly labeled, isolated sample. If real monitoring is not ready, replace the navigation item with a truthful beta wait state and keep demonstrations on a public sample route.

### C2. The purchase promise and implemented purchase path do not match

Pricing presents Quick Investigation, Professional Investigation, Business Intelligence Report, and Continuous Monitoring at four prices. Every plan links to the same intake route without a plan identifier. Intake copy still describes one Business Investigation and one Executive Report for $9.90. The payment button accepts plan and price properties but does not use them, creates a generic checkout intent, and returns the customer to `/workspace`.

**Impact:** Customers cannot know which product they selected, what amount will be charged, or where payment happens. This is a conversion, support, and commercial-consent risk.

**Required outcome:** Beta launches with one purchasable SKU or a fully connected plan selection. The chosen SKU, scope, price, currency, taxes, customer, and deliverable must persist from pricing through receipt and report entitlement.

### C3. Parallel customer products remain active

The repository exposes `/workspace`, `/investigations`, `/cases`, `/dashboard`, `/reports`, `/archive`, `/report`, `/analysis`, `/radar`, `/entity-intelligence`, `/entity-runtime`, `/trust-intelligence`, `/monitoring`, `/workspace/monitoring`, `/watchlist`, and `/alerts`. Some use the authenticated shell, some use the public shell, and some use standalone bespoke layouts.

**Impact:** Customers can land in different navigation and data contexts through links, bookmarks, search engines, or support messages. The breadth feels unfinished rather than premium.

**Required outcome:** Publish one canonical route map. Redirect or remove every superseded customer route. Gate internal demonstrations and operations behind an internal environment and role.

### C4. Authenticated surfaces do not use one identity and account model

The workspace uses a server-resolved actor and organization role. The Account and parts of Admin read a browser session and use the public shell. The public header can show a connected email but offers no direct workspace or account action. There is no password reset, email verification explanation, profile editing, session management, account deletion, or organization management.

**Impact:** Session behavior appears inconsistent and the account area does not meet normal SaaS expectations.

**Required outcome:** Protect all private routes at the server boundary, use one actor model, and place Account inside the workspace shell. Add the minimum recovery and lifecycle flows required for beta support.

### C5. Legal pages are summaries, not a complete commercial policy set

The legal pages explain the service at a high level and record an acceptance version. They do not provide a complete commercial identity, effective and updated dates, governing entity and address, governing law and venue, payment authorization details, refund and cancellation rules, account termination process, service availability terms, retention periods, deletion process, international transfer basis, cookie and analytics disclosure, subprocessors, data-subject rights by region, breach communication approach, or child-use restrictions.

**Impact:** A customer cannot make a fully informed purchase or complete a normal vendor review. Legal counsel must approve the final content.

**Required outcome:** Replace summary copy with reviewed commercial policies, publish effective dates and contact details, and connect acceptance records to the exact policy versions shown at purchase.

## 4. Page-by-page audit

### 4.1 Landing page

**What works**

- The page establishes a serious visual tone and exposes methodology, pricing, security, and a sample.
- A customer can start an Investigation from the primary shell.
- Evidence, confidence, and decision context support the product's trust proposition.

**Gaps**

- The homepage presents a platform breadth that exceeds the current self-serve purchase path.
- Multiple capability narratives compete with the single transaction.
- Trust proof is mostly product-authored. There is no clear coverage matrix, service status, named company identity, customer proof, or reviewed security posture.
- Product CTA color changes between violet in the desktop header, red on mobile, and other accent colors on page surfaces.

**Recommendation**

Use one hero proposition, one primary `Start Investigation` action, and one secondary `View Sample Executive Report` action. Put required input, current price, typical processing expectation, and output in one compact block. Follow it with the four-stage method, exact coverage, sample output, security and privacy proof, and a final repeated CTA.

### 4.2 Investigation flow and intake

**What works**

- The flow supports several target forms, optional evidence, validation, a preview, authentication handoff, and checkout preparation.
- Required and optional concepts are often labeled.
- The product explains that evidence quality affects conclusions.

**Gaps**

- The intake page is unusually large and combines acquisition, target choice, evidence upload, diagnostics, preview, lead capture, legal acceptance, and checkout.
- `Website / Business`, `Marketplace / Seller`, and `Evidence Review` feel like separate products before the customer understands scope.
- Technical provider and evidence language competes with the customer's basic decision.
- The flow does not carry a pricing-plan choice from Pricing.
- The customer is sent to the workspace after intent creation, with no visible provider-selection, authorization, success, failure, or receipt step in the shared payment component.

**Recommendation**

Split the journey into four visible steps: Business, Scope, Evidence, Review and pay. Ask for the minimum identity first. Resolve and confirm the Business before optional evidence. Keep provider diagnostics behind `Coverage details`. Present a final order summary with plan, target, email, price, terms, and deliverable.

### 4.3 Workspace

**What works**

- The authenticated shell provides a stable sidebar, account identity, role, sign-out, and clear content landmark.
- The main workspace prioritizes investigations and provides search.
- Empty state and new-investigation action are visible.

**Gaps**

- The investigations component contains demo fallback cases when its supplied list is empty. A genuine empty account can therefore look populated.
- The information architecture uses Investigations, Reports, Monitoring, Alerts, and Archive, but Reports and Archive overlap conceptually.
- The shell has no Account, Help, support, organization switcher, billing, notification center, or environment indication.
- Symbol characters are used as icons. They have inconsistent weight, alignment, and meaning.
- Search appears local to the current list. Scope, matching rules, and result count are not explained.

**Recommendation**

Remove all customer-facing demo fallbacks. Make Investigations the work index and place completed reports within each investigation. Keep Archive only if it represents intentionally archived records, not completed work. Use a consistent icon library, add Account and Help, and show filters and results as persistent URL state when volume requires them.

### 4.4 Reports

**What works**

- The report library has a focused empty state and direct `Open report` actions.
- The report route supports locked, processing, and ready modes.
- Report structures emphasize evidence, findings, recommendations, and limitations.

**Gaps**

- Report, Reports, Executive Report, Full Report, Professional Report, Business Intelligence Report, Website Intelligence Report, analysis, and Sample Report coexist.
- `/reports` and `/archive` both present completed work without a clear distinction.
- `/report`, `/report/analysis`, and `/analysis` remain parallel report-like destinations outside the authenticated shell.
- The report handoff lacks one universally visible identity block with Business, Investigation ID, Report ID, issue date, version, scope, and policy version.
- Share, print, export, correction request, and support behavior are not presented as a coherent policy.

**Recommendation**

Use `Executive Report` for the deliverable and `Reports` only as a navigation label if a separate library remains. One Investigation owns one current Executive Report and its versions. Add a stable report identity header, print specification, supported sharing rule, and correction workflow.

### 4.5 Monitoring

**What works**

- The workspace design includes summary metrics, risk trends, alerts, entity lists, and chronological history.
- The model suggests a useful recurring product after the core transaction is stable.

**Gaps**

- Authenticated monitoring is demo-backed.
- `/monitoring`, `/workspace/monitoring`, and `/watchlist` represent different implementations.
- The pricing page sells Continuous Monitoring for $299 per month without a connected subscription, onboarding, or entitlement flow.
- A `Filter alerts` button appears without an implemented interaction in the entity timeline.

**Recommendation**

Remove Monitoring from the beta purchase catalog unless recurring billing and tenant data are ready. If retained as an invite-only beta, state its status, eligibility, observed sources, scan frequency, last check, and alert policy. Merge watchlist management and monitoring detail into the workspace route family.

### 4.6 Alerts

**What works**

- Filters cover domain, severity, category, and status.
- Alert rows include evidence source, previous and current values, explanation, and recommended action.
- Loading, errors, empty filters, authentication prompts, and pending updates are represented.

**Gaps**

- `/alerts` uses the public shell rather than the authenticated workspace shell even though Alerts is workspace navigation.
- It belongs to the separate Website Intelligence model, while workspace monitoring uses another alert model.
- Text arrows and dot separators are used in dense content and need screen-reader review.
- There is no saved filter, bulk action, ownership, notification preference, or link back to the canonical Investigation.

**Recommendation**

Choose one alert schema and render it only in the authenticated shell. Connect every alert to its monitored Business and relevant Investigation. For beta, keep filtering simple and add status, assignee only if teams are supported, last updated, and a clear resolution action.

### 4.7 Archive

**What works**

- Archive has route-level loading and error states and appears in the workspace shell.

**Gaps**

- The term competes with Reports and completed Investigations.
- The product does not define what moves to Archive, who can restore it, or whether archiving affects monitoring and access.

**Recommendation**

For beta, remove Archive as a primary destination unless customers can intentionally archive and restore records. Otherwise use a filter on Investigations. Define retention and deletion separately from UI archiving.

### 4.8 Admin

**What works**

- Admin is role-gated in the workspace navigation.
- The console exposes operational status and record lookup concepts.

**Gaps**

- `/admin` and `/admin-lite` duplicate administrative surfaces.
- Admin mixes browser identity checks with a server-protected layout.
- Raw JSON and operational controls are presented in a customer-styled UI without a clear audit-log hierarchy.
- Empty and unavailable labels are generic. Destructive action patterns and confirmation requirements are not consistently visible.

**Recommendation**

Keep one internal Admin console. Require server authorization for the page and every action. Separate support lookup, payment recovery, provider health, and audit events. Display immutable actor, timestamp, reason, before and after state for sensitive changes.

### 4.9 Login

**What works**

- The form is short and preserves a validated relative return path.
- Loading and error feedback are present.
- The page explains workspace benefits and links to account creation.

**Gaps**

- No `Forgot password`, password visibility control, email verification state, or support route exists.
- Input autocomplete attributes are not explicit.
- Error copy may expose raw authentication service messages.
- A connected user can still visit Login without an intentional account-switch path.

**Recommendation**

Add password recovery, verification guidance, show-password control, autocomplete, safe mapped errors, and a signed-in redirect. Keep the form as the visual focus and reduce supporting benefit cards on mobile.

### 4.10 Signup

**What works**

- The form confirms the password and records acceptance of Terms and Privacy.
- Loading, validation, and return path behavior are present.

**Gaps**

- Password requirements are not visible before failure.
- There is no company or workspace naming step, verification expectation, duplicate-account recovery, or explanation of email use.
- Legal links interrupt the form without an explicit same-tab return strategy.
- Marketing consent and essential service communication are not distinguished.

**Recommendation**

State password rules in-line, explain verification before submission, and create the organization after identity verification or during a short onboarding step. Keep marketing consent separate and optional if used.

### 4.11 Terms

**What works**

- Terms are readable, localized, and tied to a legal acceptance version.
- Limitations and independent third-party decisions are called out.

**Gaps requiring legal review**

- Legal entity name, registered address, and effective and last-updated dates.
- Eligibility, authorized business use, account responsibility, and acceptable use.
- Order formation, taxes, receipts, refunds, cancellations, disputes, and chargebacks.
- Subscription renewal and cancellation terms if Monitoring is sold.
- Intellectual property, customer content license, feedback, confidentiality, and third-party sources.
- Service availability, changes, suspension, termination, data export, and post-termination retention.
- Warranties, liability cap, indemnity, governing law, venue, notices, assignment, severability, and entire agreement.

### 4.12 Privacy

**What works**

- The page identifies investigation inputs, service providers, security, and a privacy contact.
- It states that customer documents and marketplace data are not sold.

**Gaps requiring privacy and legal review**

- Controller identity and contact address.
- Categories, purposes, and legal bases for each data type.
- Cookies, analytics, device data, logs, and marketing data.
- Named subprocessor list or maintained subprocessor page.
- Retention periods by data category and deletion mechanics.
- International transfers and safeguards.
- Access, correction, deletion, restriction, objection, portability, appeal, and complaint rights.
- Region-specific disclosures, including applicable U.S. state and EEA or UK terms.
- Children, automated decision support, public-source data, evidence about third parties, and breach notices.

### 4.13 Security

**What works**

- The page uses clear, restrained language about collection and evidence handling.
- It warns customers not to provide passwords or card credentials.

**Gaps**

- It is a security-principles page, not a security assurance page.
- There is no reporting channel for vulnerabilities, security contact, response expectation, status page, subprocessor link, encryption statement, backup approach, retention control, access review, incident response summary, penetration-test posture, or compliance status.
- Claims are not dated or scoped by environment.

**Recommendation**

Publish only verified controls. Add a security contact and coordinated disclosure process. Provide dated statements for encryption, tenant isolation, access control, logging, backups, incident handling, and vendor management after engineering validation.

### 4.14 Pricing

**What works**

- The plan cards describe decisions rather than only feature counts.
- Prices and billing periods are visible.
- Comparison and FAQ sections provide a useful evaluation structure.

**Gaps**

- Only the $9.90 path is represented consistently elsewhere.
- Four CTAs lead to the same unparameterized intake.
- Scope boundaries between Professional and Business Intelligence are subjective.
- Currency, taxes, refund rule, delivery timing, source coverage, human review, and payment method are absent.
- Monitoring is presented as generally purchasable although the workspace surface is demo-backed.

**Recommendation**

Launch beta with one current offer. Put future plans on an internal roadmap or a factual `Contact us` path. If multiple tiers remain, define measurable scope, persist the selected SKU, and show an exact order summary before authorization.

### 4.15 Sample Report

**What works**

- Demonstration data is clearly labeled.
- The page covers findings, evidence, coverage, actions, and limitations.
- It includes direct purchase and pricing actions.

**Gaps**

- `/sample-report` presents a Website Intelligence Report while `/example-report` presents an Investigation decision memo.
- The visual blue report system differs from the black and red marketing system and the authenticated report experience.
- The sample does not prove that it is the exact structure a paid customer receives.

**Recommendation**

Keep one `Sample Executive Report`. Render it with the production report component and a fixed sanitized fixture. Label every illustrative value. Add scope, issue date, version, sources checked, unavailable sources, limitations, and a print preview.

### 4.16 Navigation and footer

**What works**

- The public header has a manageable desktop set and the footer groups product, trust, and access links.
- The workspace sidebar clearly separates primary work from Administration.
- Both shells provide skip links and active-state treatment.

**Gaps**

- The public header shows `Connected: email` instead of useful `Open workspace` and `Account` actions.
- Desktop CTA is violet, mobile CTA is red, checkout is emerald, and sample CTA is blue.
- The mobile menu adds About, Privacy, Terms, and Contact, creating a long undifferentiated list.
- The workspace uses text symbols rather than a coherent icon set.
- Account is not in workspace navigation and authenticated Alert routes can render the public shell.

**Recommendation**

Adopt one accent for primary action, one success color, one warning color, and one danger color. For signed-in users, show `Open workspace` plus an account menu. Use consistent icons with text labels. Keep legal links in the footer and make Help available in both shells.

### 4.17 Mobile layout

**What works**

- The public menu collapses, controls generally use usable minimum heights, and grids include responsive breakpoints.
- The workspace has a collapsible sidebar.

**Risks to validate**

- Intake density, evidence queue, order review, and long localized copy at 320 and 375 pixels.
- Focus management, scroll lock, and close behavior for both menus.
- Wide pricing and admin tables, report evidence tables, long IDs, emails, URLs, and untranslated operational labels.
- Sticky headers with virtual keyboards and browser zoom at 200 and 400 percent.
- RTL layout in the workspace, which contains hardcoded English and direction-sensitive symbols.

**Recommendation**

Define mobile acceptance at 320, 375, 768, and 1024 pixels. Replace wide tables with labeled cards below 768 pixels. Test English and Hebrew with long data, keyboard-only input, 200 percent zoom, and reduced motion.

## 5. Cross-product system audit

### Visual consistency

The dominant black, zinc, red system is recognizable. Premium consistency is reduced by large page-specific radii, multiple accent palettes, bespoke CSS modules, Tailwind-only pages, compressed one-line components, and separate marketing, report, monitoring, entity, and dashboard design languages.

Create design tokens for surface, border, text, accent, state colors, radii, shadow, width, spacing, and motion. Limit core layouts to public marketing, authentication, workspace, report document, and internal Admin.

### Typography

Headings use a strong weight and tight tracking, but page hierarchy varies from oversized marketing display headings to dense operational labels. Uppercase labels with wide letter spacing are overused and can become difficult to scan.

Adopt a six-level type scale and three text roles: display, interface, and document. Reserve uppercase labels for short eyebrows and status metadata. Use tabular numerals for prices, scores, timestamps, and IDs.

### Color system

Red, violet, emerald, sky blue, amber, yellow, and zinc all act as interactive accents. This makes color meaning unstable.

Use the brand accent for primary action, neutral borders for structure, green only for verified success, amber for attention, and red for material risk or destructive actions. Never use risk red as the only signifier for the brand CTA and errors at the same time.

### Spacing and density

Marketing pages often use generous spacing, while operational pages and the intake compress many concepts into a single view. Card padding and radius vary widely.

Use an 8-pixel spacing system, two standard content widths, three card densities, and predictable section spacing. Progressive disclosure should reduce the default intake and report density.

### Icons

The product mixes SVG brand imagery, Unicode shapes, punctuation, arrows, bullets, and text icons.

Choose one accessible outline icon set. Standardize sizes at 16, 20, and 24 pixels. Pair unfamiliar icons with labels and keep decorative icons hidden from assistive technology.

### Empty states

Important routes have empty states, but the quality varies. Some include a next action, while others are plain status sentences. Demo fallback data prevents a truthful empty state in the main workspace.

Every empty state should explain the object, why the list is empty, and one relevant action. Filter-empty and first-use-empty states should be different. Never replace an empty customer account with fictional data.

### Loading states

Workspace, Archive, Reports, and case detail routes have loading boundaries. Several client pages use plain `Loading...` rows. Authentication and list updates disable controls but do not always announce progress.

Use layout-stable skeletons for initial loads, inline progress for mutations, and `aria-live` announcements for meaningful completion. Loading copy must distinguish authentication, data retrieval, payment authorization, and report generation.

### Error states

Global and route errors exist, and several forms show local errors. The language is often generic and does not include a reference or support path.

Define recoverable validation, authentication, permission, network, payment, provider, processing, and unknown error patterns. Each state needs a safe retry, preserved input where appropriate, and an Investigation or support reference.

### Accessibility

The code contains good foundations: landmarks, labels, skip links, `aria-current`, minimum control heights, and focus rings. Remaining risks include dynamic announcements, focus movement after validation and menu opening, color contrast on muted text, icon semantics, table reflow, RTL, raw status language, and nested document structure.

Beta acceptance requires automated axe checks plus manual keyboard and screen-reader walkthroughs of registration, login, intake, checkout, workspace search, report opening, and logout.

### Trust indicators

Current trust indicators are methodology, security content, legal pages, sample output, evidence sources, limitations, and contact options. Missing proof includes an exact company identity, effective policy dates, data lifecycle, coverage matrix, payment and refund terms, service status, security disclosure channel, and verifiable customer or partner proof.

Do not add generic badge rows. Publish evidence for each claim and link the claim to its scope.

## 6. Workflow audit

### Login

The primary path is coherent and the return path is constrained to a local URL. Add recovery, verification, mapped errors, explicit autocomplete, and signed-in redirect behavior.

### Logout

The shared logout function should remain the only exit mechanism. It must clear browser state, call the server DELETE session route, revoke the provider session where possible, and prove that protected pages and APIs reject the old session. The UI should show a failure-safe signed-out result without trapping the customer.

### Session persistence

The product currently combines an HTTP-only access-token cookie with browser session state. Align refresh, expiry, revocation, and actor hydration around one server-owned session contract. Test page reload, direct deep link, expired access token, multiple tabs, account switch, return from payment, and sign-out.

### Investigation creation

There are intake and workspace creation concepts. Intake should be the only new-Investigation path. Workspace can launch intake and resume drafts. The resulting record must preserve target, chosen scope, customer, evidence, plan, acceptance versions, and canonical Investigation ID.

### Payment flow

The customer-facing sequence is incomplete. Define these observable states: order review, provider selection, provider authorization, confirming, paid, delayed, declined, canceled, duplicate, refunded, disputed, and support review. Payment success grants an entitlement through a server event, not a browser redirect. Report generation begins after durable entitlement and has separate status.

### Report unlock

Unlock should be a property of the paid Investigation, not an independent page concept. The locked view shows what is included, the exact order, and why access is restricted. After payment, refresh from server state and move to Processing or Report without asking the customer to repeat payment.

### Workspace navigation

The shell should preserve organization, account, and current item context. Breadcrumbs are useful only on Investigation and report detail. All shell links must use the same server session and data scope.

### Report viewing

The first viewport should answer: what Business, what decision, what recommendation, how confident, what changed, and what action is next. Supporting evidence follows. Keep analyst tools and engine diagnostics outside the customer report.

### Search

Workspace search needs a defined scope and accessible result feedback. Search Business name, canonical identifier, Investigation ID, and Report ID. Debounce only if server-backed, preserve the query in the URL, and provide a clear reset.

### Filters

Use filters only when records justify them. For beta, Investigation status and date are sufficient. Alerts may also use severity and resolution. Show active filters as removable chips, announce result count, preserve filters in the URL, and separate `No records` from `No matches`.

## 7. Canonical terminology

| Use | Definition | Retire or restrict |
| --- | --- | --- |
| Business | The entity being reviewed | Target in customer copy, company when the entity may not be a company |
| Investigation | The durable customer work item | Scan, case in customer UI, assessment as a separate product |
| Executive Report | The purchased decision-ready output | Full Report, Professional Report, Website Intelligence Report, Business Intelligence Report as parallel names |
| Evidence | Sources and submitted materials supporting a conclusion | Signal when shown without explanation |
| Finding | A sourced observation relevant to the decision | Result when referring to a report conclusion |
| Recommendation | The action supported by the report | Decision when it implies an automated final authority |
| Confidence | Support for a specific conclusion | Multiple unexplained score types |
| Monitoring | Recurring review after an Investigation | Watchlist as a separate product |
| Alert | A material monitored change | Event when customer action is expected |
| Workspace | The authenticated customer product | Dashboard as a separate destination |
| Account | Personal identity and security settings | Profile and user portal as competing destinations |

## 8. Canonical information architecture

### Public

- `/`: Overview
- `/product`: Product and coverage
- `/sample-report`: Sample Executive Report
- `/methodology`: Methodology
- `/pricing`: Current beta offer
- `/security`: Security
- `/about`: Company
- `/contact`: Contact and support
- `/login`: Sign in
- `/signup`: Create account
- `/terms`: Terms
- `/privacy`: Privacy

### Authenticated

- `/workspace`: Investigations
- `/workspace/investigations/[id]`: Investigation detail
- `/workspace/investigations/[id]/report`: Executive Report
- `/workspace/monitoring`: Monitoring, only when backed by real customer data
- `/workspace/alerts`: Alerts, only when Monitoring is enabled
- `/workspace/account`: Account and session settings
- `/workspace/billing`: Purchases, receipts, and subscription only if applicable
- `/admin`: Internal role-gated console

### Redirect, hide, or internalize

- Merge `/example-report` into `/sample-report`.
- Redirect `/investigations`, `/cases`, `/dashboard`, `/reports`, `/archive`, and `/report` to their canonical workspace equivalents after data migration.
- Merge `/monitoring`, `/watchlist`, and `/alerts` into the workspace family.
- Hide `/analysis`, `/radar`, `/entity-intelligence`, `/entity-runtime`, `/trust-intelligence`, `/quality`, `/leads`, and `/admin-lite` from public and customer navigation. Keep only those required for internal operations.
- Redirect `/upgrade` to the current pricing offer, as it does today.
- Review SEO landing routes separately. They may remain public acquisition pages, but every CTA must enter the same canonical Investigation flow.

## 9. Payment provider architecture

Do not add five independent button implementations. Create a provider-neutral commerce domain first.

### Required domain records

- **Product:** immutable SKU, name, scope, currency, amount, tax behavior, availability.
- **Order:** customer, organization, Investigation, line item, quoted total, currency, locale, policy versions.
- **Checkout session:** provider, provider session ID, status, expiry, return and cancel context.
- **Payment attempt:** provider, method, amount, state, failure category, idempotency key.
- **Provider event:** immutable signed event payload reference, event ID, received time, processing result.
- **Transaction:** authorization, capture, refund, dispute, fees, provider references.
- **Entitlement:** the Investigation and report access granted by settled funds.
- **Receipt:** stable customer-facing purchase record.

### Provider adapter contract

Each provider adapter should implement:

1. `createCheckout(order)`
2. `verifyWebhook(request)`
3. `normalizeEvent(event)`
4. `getPayment(providerReference)`
5. `refund(transaction, amount, reason)`
6. `capabilities()` for supported currencies, wallets, recurring payments, and refunds

The commerce service owns state transitions, idempotency, entitlements, receipts, and audit events. Provider adapters do not grant report access.

### Provider strategy

| Method | Recommended implementation | Notes |
| --- | --- | --- |
| PayPal | PayPal adapter and hosted approval | Treat current support as the first adapter. Reconcile with signed server events. |
| Credit Card | Stripe Payment Element or another approved processor | Do not collect raw PAN or CVV in ShadowScore. Use hosted fields or elements. |
| Apple Pay | Wallet exposed through the approved card processor | Domain verification and device or browser eligibility are required. |
| Google Pay | Wallet exposed through the approved card processor | Eligibility and regional support are provider controlled. |
| Stripe | Stripe adapter for Payment Intents, Checkout, webhooks, refunds, and disputes | Stripe is a processor integration. Credit Card, Apple Pay, and Google Pay are methods within it. |

### Payment UX

1. Review order with Business, Investigation, SKU, deliverable, price, currency, taxes, and customer email.
2. Accept the exact Terms and Privacy versions.
3. Choose among eligible methods returned by the commerce service.
4. Authorize on a provider-hosted or provider-controlled surface.
5. Return to a `Confirming payment` state that reads server status.
6. Show paid, delayed, declined, or canceled with specific next actions.
7. Grant report entitlement from verified server events.
8. Show receipt, support reference, and report-generation status separately.

### Architecture acceptance criteria

- Prices and currency are loaded from an approved server catalog, never trusted from browser props.
- Every provider request and event is idempotent.
- Duplicate and out-of-order events cannot grant duplicate entitlements.
- Return URLs do not determine payment success.
- Refund and dispute policies update entitlements according to an approved rule.
- Payment and report-generation failures are separate states.
- Logs exclude credentials, card data, and unneeded personal information.
- Sandbox certification covers success, cancel, decline, delay, duplicate, refund, dispute, and expired session.

## 10. Prioritized backlog

Effort is a relative product estimate: **S** up to 2 focused days, **M** 3 to 5 days, **L** 1 to 2 weeks, **XL** multi-team or vendor-dependent. Final estimates require technical design.

### Critical, complete before external beta

| ID | Outcome | Effort | Acceptance signal |
| --- | --- | ---: | --- |
| BR-01 | Remove demo records from all authenticated routes | M | A new account shows a truthful empty state and no fictional entity. |
| BR-02 | Freeze one beta SKU and purchase promise | S | Homepage, Pricing, intake, order, receipt, and report use one name, price, and scope. |
| BR-03 | Complete the end-to-end payment state machine | XL | Verified server settlement grants one entitlement and every exception has a recovery path. |
| BR-04 | Consolidate canonical workspace routes and data | XL | One Investigation appears consistently in list, detail, report, and support lookup. |
| BR-05 | Consolidate authentication and actor boundaries | L | Every private page is server protected and logout invalidates the old session. |
| BR-06 | Replace legal summaries with counsel-reviewed policies | L | Policies include commercial identity, dates, purchase rules, retention, rights, and versioned acceptance. |
| BR-07 | Remove or gate duplicate and internal product routes | M | A customer cannot navigate or search into a parallel shell or demo console. |
| BR-08 | Publish truthful source and jurisdiction coverage | M | Each report states checked, unavailable, stale, and insufficient coverage. |

### High impact UX improvements

| ID | Outcome | Effort | Acceptance signal |
| --- | --- | ---: | --- |
| BR-09 | Redesign intake as four progressive steps | L | A first-time user reaches review without assistance and can explain what is optional. |
| BR-10 | Create one order review and receipt pattern | M | Target, SKU, amount, policy versions, and Investigation ID remain visible. |
| BR-11 | Standardize report identity and handoff | M | Every report exposes Business, IDs, date, version, scope, confidence, limitations, and next action. |
| BR-12 | Merge Sample and Example Report | M | The sample uses the production report renderer and exact beta report structure. |
| BR-13 | Simplify workspace IA | M | Investigations owns work and Archive no longer duplicates completed reports. |
| BR-14 | Add password recovery and verification states | M | A user can recover access without support and sees safe, specific status copy. |
| BR-15 | Establish design tokens and one CTA hierarchy | L | All audited pages use consistent color roles, type, spacing, radius, and interactive states. |
| BR-16 | Complete manual accessibility journey audit | M | Critical journeys pass keyboard, screen-reader, reflow, contrast, RTL, and reduced-motion review. |
| BR-17 | Define report print and supported sharing | M | An authorized customer can produce and share a readable version with clear access rules. |

### Medium improvements

| ID | Outcome | Effort | Acceptance signal |
| --- | --- | ---: | --- |
| BR-18 | Add Account to the workspace shell | M | Profile, security, sessions, organization, and sign-out share the server actor. |
| BR-19 | Standardize all loading, empty, error, and locked states | M | Every state names the object, status, recovery action, and support reference when needed. |
| BR-20 | Replace symbol icons with an accessible icon set | S | Navigation and actions use consistent icons and labels. |
| BR-21 | Make search and filters URL-backed | M | Queries survive navigation, announce count, and distinguish no records from no matches. |
| BR-22 | Consolidate Monitoring, Watchlist, and Alerts | L | One customer data model powers all recurring-risk views. |
| BR-23 | Split internal Admin into clear operational modules | L | Support, payments, providers, and audits have role-specific views and immutable histories. |
| BR-24 | Create security assurance and disclosure pages | M | Verified controls, security contact, status, and subprocessors are discoverable. |
| BR-25 | Add product analytics for the canonical funnel | M | Consent-aware events measure visit, start, scope, order, payment, ready, open, and repeat. |

### Nice to have, validate with beta evidence

| ID | Outcome | Effort | Validation trigger |
| --- | --- | ---: | --- |
| BR-26 | Saved Business profiles and repeat-investigation shortcuts | L | Repeat buyers re-enter the same identity data. |
| BR-27 | Controlled colleague sharing | XL | Customers need recurring access for multiple decision-makers. |
| BR-28 | Saved searches and alert filters | M | Users manage enough records that temporary filters cause friction. |
| BR-29 | In-product notification center | L | Email and list status are insufficient for report and alert follow-up. |
| BR-30 | Rich organization roles and invites | XL | Beta accounts demonstrate collaborative ownership needs. |
| BR-31 | Personalized onboarding checklist | M | Activation analysis shows users miss important setup steps. |
| BR-32 | Additional payment providers | XL each | Conversion, region, reliability, or customer demand justifies provider cost. |

## 11. Roadmap

### Sprint 2: Coherence and commercial truth

**Goal:** Present one honest beta product and remove trust-breaking contradictions.

**Scope**

- BR-01 remove authenticated demo data.
- BR-02 freeze the beta SKU, price, and product language.
- BR-04 decide canonical Investigation, report, and workspace records. Complete route and migration design.
- BR-05 unify private-route and actor requirements.
- BR-06 begin legal counsel review and publish required policy inventory.
- BR-07 redirect, hide, or gate duplicate and internal routes.
- BR-08 publish a coverage matrix and insufficient-evidence rule.
- BR-12 define the canonical Sample Executive Report.
- BR-13 approve the workspace IA.
- BR-15 approve design tokens and CTA hierarchy.

**Exit criteria**

1. A first-time customer sees one product, one current price, one start route, one workspace, and one report name.
2. A new account contains no demonstration data.
3. Public and private route maps have approved owners, redirects, indexing rules, and data sources.
4. Legal counsel has a complete policy draft and verified business details.
5. The team has approved payment and report architecture before implementation expands.

### Sprint 3: Purchase and delivery confidence

**Goal:** Make the core transaction dependable and understandable from intake through report delivery.

**Scope**

- BR-03 implement provider-neutral orders, attempts, events, transactions, entitlement, and receipt foundations for the current payment provider.
- BR-04 finish canonical persistence and report ownership.
- BR-09 deliver the four-step intake.
- BR-10 deliver order review, confirming, exception, and receipt states.
- BR-11 deliver the report identity and handoff.
- BR-14 add password recovery and verification.
- BR-17 implement the approved print and sharing policy.
- BR-18 move Account into the workspace shell.
- BR-19 standardize async and locked states.
- BR-25 instrument the canonical funnel.

**Exit criteria**

1. A successful server-verified payment grants one durable report entitlement.
2. Cancel, decline, delay, duplicate callback, processing failure, refund, and support recovery are tested.
3. A user can leave, return, find the Investigation, understand its status, and open the exact purchased report.
4. Authentication recovery and logout work across direct links and multiple tabs.
5. Funnel and reliability events contain no sensitive evidence or payment data.

### Sprint 4: Premium beta validation

**Goal:** Validate the complete experience with real users, devices, and operating procedures.

**Scope**

- BR-15 apply the design system across canonical pages.
- BR-16 complete accessibility and responsive remediation.
- BR-20 adopt the icon system.
- BR-21 finish search and core Investigation filters.
- BR-22 enable real Monitoring and Alerts only if tenant data, entitlement, and billing are ready. Otherwise keep them out of beta.
- BR-23 harden the internal Admin console and audit history.
- BR-24 publish verified security assurance content.
- Run the screenshot matrix and cross-browser journey review.
- Conduct 10 to 20 observed beta sessions and resolve critical comprehension and recovery failures.

**Exit criteria**

1. Critical journeys pass desktop and mobile review in supported browsers, keyboard-only use, one screen reader, 200 percent zoom, RTL, and reduced motion.
2. A new user can state the product, price, scope, status, and report limitations accurately without assistance.
3. Support can find any payment and Investigation by reference and explain its event history.
4. Policies, security claims, and product coverage match deployed behavior.
5. Monitoring is either production-backed and clearly scoped or absent from the beta offer.

## 12. Definition of beta ready

ShadowScore is ready for an external beta when all of these are true:

- One canonical customer journey exists from acquisition through repeat purchase.
- The customer sees no seeded, shared, or unlabeled demonstration data in a private route.
- Product name, scope, price, currency, timing, and deliverable remain consistent.
- Payment status is verified on the server and exceptions are recoverable.
- The Investigation and Executive Report are durable, tenant-scoped, and support-visible.
- Every conclusion states evidence, source date, coverage, confidence, and limitations.
- Legal and security content has an accountable owner and matches actual practice.
- Critical accessibility, mobile, localization, and browser checks pass.
- Customer support has references, playbooks, and audited recovery actions.
- Observed beta users can complete the journey and accurately explain the result.

## 13. Suggested screenshots and mockups

Capture these before Sprint 2 implementation and again at each sprint exit. Use a new account, an active Investigation, a payment exception, and a ready report. Do not use fictional data in authenticated acceptance captures unless the environment is explicitly labeled as a demo.

### Baseline screenshot matrix

| Surface | Desktop | Mobile | Required states |
| --- | --- | --- | --- |
| Homepage | 1440×900 | 375×812 | Top, method, trust proof, final CTA, mobile menu |
| Pricing | 1440×1200 | 375×812 | Offer, comparison, FAQ, long localized copy |
| Login and Signup | 1280×900 | 320×700 | Default, validation, loading, service error |
| Intake | 1440×1000 | 375×812 | Each step, upload, validation, review, legal acceptance |
| Payment | 1280×900 | 375×812 | Review, method, confirming, paid, delayed, declined, canceled |
| Workspace | 1440×900 | 375×812 | First-use empty, active list, search no-match, menu open |
| Investigation | 1440×1000 | 375×812 | Needs input, processing, failed, ready |
| Executive Report | 1440×1200 | 375×812 | Summary, evidence, limitations, print preview |
| Monitoring and Alerts | 1440×1000 | 375×812 | Empty, populated, filtered, error, entity timeline |
| Account | 1280×900 | 375×812 | Profile, security, sessions, organization |
| Admin | 1440×1000 | 768×1024 | Lookup, payment recovery, provider failure, audit event |
| Legal and Security | 1280×1000 | 375×812 | Contents, effective date, contact, long section |

### Mockups to prepare

1. **Canonical funnel storyboard:** Homepage, four-step intake, order review, provider authorization, confirming, processing, report.
2. **Workspace IA:** Desktop sidebar and mobile drawer with Investigations, conditional Monitoring, Account, and Help.
3. **Investigation detail:** Identity, status, evidence, activity, payment, and Executive Report in one record.
4. **Executive Report first page:** Report identity, recommendation, confidence, material findings, limitations, and next action.
5. **Payment exception map:** Delayed, declined, canceled, duplicate, refunded, and generation failed.
6. **State library:** Empty, loading, no-match, permission denied, network failure, provider failure, locked, and archived.
7. **Legal purchase panel:** Order details, exact policy versions, refund summary, and payment-provider disclosure.
8. **Responsive table alternatives:** Pricing comparison, report evidence, alerts, and Admin event history rendered as cards on small screens.

## 14. Product review cadence

Use this document as the single product roadmap through Sprint 4. At each sprint review:

1. Demonstrate the whole customer journey, not isolated routes.
2. Compare the approved screenshot baseline with the current build.
3. Close backlog items only against their acceptance signals.
4. Record scope changes, product-language changes, and new legal claims.
5. Add new features only when they support a roadmap outcome or measured beta need.

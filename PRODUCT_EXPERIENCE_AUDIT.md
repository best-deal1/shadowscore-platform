# Product Experience Audit: Information Architecture Sprint 1

Date: 2026-07-10  
Scope: Product experience only. No Investigation Engine, Decision Engine, Ontology, Knowledge Graph, Providers, or Payments code was changed.

## Executive Summary

ShadowScore already has the ingredients of a premium SaaS product: a clear risk-intelligence promise, authenticated workspace, intake flow, report detail view, account settings, legal/security pages, and admin visibility. The experience does not yet feel like one canonical product because the information architecture exposes several duplicated or legacy routes, mixes public marketing journeys with authenticated workspace journeys, and uses inconsistent nouns for the same user objects.

The most important IA issue is that `/dashboard`, `/workspace`, and `/reports` currently render the same dashboard experience, while `/investigations` renders the same intake experience as `/intake`. This creates duplicate page identities, duplicate navigation concepts, and unclear user expectations. A premium SaaS IA should make `/workspace` the signed-in product home, `/investigations` the canonical investigation creation/history area, `/reports` the canonical report library, and `/report?reportId=` the report detail route.

## Audit Method

Reviewed the application from the perspective of first-time visitor, signed-out evaluator, signed-in user, paying customer, and admin/operator. Reviewed route files, shared layout/navigation, authentication redirects, primary CTAs, loading states, locked states, empty states, and public legal/trust pages.

## Current Route Inventory

| Current route | Current role | Auth | Observed issue |
|---|---|---:|---|
| `/` | Public homepage and free investigation entry | Public | Strong primary CTA, but overlaps with `/intake` and `/radar` messaging. |
| `/about` | Company/product positioning | Public | Useful, but should be reached from desktop header or footer only. |
| `/security` | Trust/security posture | Public | Useful for premium trust, but not visible in desktop primary nav. |
| `/privacy` | Legal/privacy | Public | Required legal page. |
| `/terms` | Legal/terms | Public | Required legal page. |
| `/contact` | Analyst/contact CTA | Public | Useful sales/support route. |
| `/login` | Sign-in | Public, redirects manually after auth | Appropriate, but should support return-to flow. |
| `/signup` | Account creation | Public | Appropriate, but route exit should be canonical `/workspace`. |
| `/intake` | Start scan/investigation | Public with optional session use | Canonical action today, but duplicated by `/investigations`. |
| `/investigations` | Re-export of `/intake` | Public | Duplicate route identity; name implies history/list but renders start form. |
| `/dashboard` | Authenticated dashboard | Protected by client redirect | Duplicate of `/workspace` and `/reports`. |
| `/workspace` | Re-export of `/dashboard` | Protected through dashboard client logic | Should be canonical signed-in home. |
| `/reports` | Re-export of `/dashboard` | Protected through dashboard client logic | Duplicate; should become report library. |
| `/report` | Report detail via query string | Session-dependent | Canonical report detail, but URL pattern should become `/reports/[reportId]`. |
| `/monitoring` | Watchlist monitoring | Protected by client redirect | Product section exists; should remain. |
| `/account` | Account settings | Protected by client redirect | Useful but should be under workspace account menu. |
| `/admin` | Read-only admin console | Protected/admin server API | Internal/operator page; should not be public nav. |
| `/admin-lite` | Read-only lightweight admin | Protected/admin allowlist | Duplicates `/admin`; merge or remove. |
| `/analysis` | Legacy marketing/report analysis page | Public | Legacy/duplicate; not in nav. |
| `/report/analysis` | Legacy analysis console | Public | Legacy/duplicate; not in nav. |
| `/example-report` | Demo report | Public | Conflicts with current report page copy saying demo reports are not displayed. |
| `/radar` | Legacy marketing landing page | Public | Duplicate top-of-funnel page. |
| `/upgrade` | Upgrade marketing/paid CTA | Public | Useful concept, but not integrated into locked report flow/nav. |
| `/leads` | Lead capture/legacy page | Public | Unclear audience and not linked from canonical nav. |

## Key Findings

### 1. Duplicate Pages

- `/workspace`, `/dashboard`, and `/reports` render the same dashboard. This makes three URLs compete for one product concept.
- `/investigations` renders `/intake`, so a noun that sounds like an investigation library opens a start form.
- `/admin` and `/admin-lite` both provide read-only operational tables for users/intakes/payments/reports.
- `/analysis`, `/report/analysis`, `/radar`, `/example-report`, `/upgrade`, and `/leads` appear to be legacy or campaign pages outside the canonical product journey.

### 2. Duplicate Navigation

- Desktop primary navigation includes `Investigations`, `Reports`, `Monitoring`, `Workspace`, and `Account`, but several of those destinations resolve to the same experiences.
- Footer product links repeat `Start Investigation`, `Investigations`, `Reports`, and `Monitoring`, but the route identities do not match user expectations.
- Mobile navigation exposes public pages that desktop header does not, creating different IA by viewport.

### 3. Inconsistent Naming

Current product language mixes:

- `scan`
- `investigation`
- `report`
- `workspace`
- `dashboard`
- `monitoring`
- `watchlist`
- `analysis`
- `radar`

Recommended canonical vocabulary:

- **Investigation** = the user-submitted target and evidence review process.
- **Report** = the paid/unlocked decision-ready output.
- **Workspace** = the signed-in product home and operational hub.
- **Monitoring** = ongoing watchlist/change tracking.
- **Account** = user profile, authentication, billing/legal records.

### 4. Missing Pages

- A true `/reports` report library page.
- A true `/investigations` investigation history/list page.
- A pricing/plans page if upgrades remain a public CTA.
- A help/support page or docs page for interpreting results.
- A billing page if payment status and report unlocks are user-visible product concepts.
- A canonical 404/not-found experience.
- A canonical access-denied page for protected/admin routes.

### 5. Inconsistent Layouts

- Most pages use `ShadowScoreLayout`, but route roles differ widely inside the same shell.
- Public marketing, product app, report detail, admin, and legal pages all use the same header/footer with no route-specific navigation strategy.
- No breadcrumb system exists for app hierarchy, so users cannot see relationships like `Workspace → Reports → Report Detail`.

### 6. Broken or Confusing User Journeys

- A user clicking `Reports` expects a report list, but lands on the dashboard.
- A user clicking `Investigations` expects saved investigations or active cases, but lands on the intake/start flow.
- A signed-out user sees app navigation items that route into client-side redirects instead of a clearly framed sign-in wall.
- The report detail route depends on a `reportId` query parameter instead of a stable nested URL.
- The product says demo reports are not displayed on `/report`, while `/example-report` exists publicly.

## Canonical Sitemap Recommendation

```text
/
├── product
│   ├── /about
│   ├── /security
│   ├── /contact
│   └── /pricing                    (new; merge /upgrade here or redirect)
├── auth
│   ├── /login
│   └── /signup
├── app
│   ├── /workspace                  (canonical signed-in home)
│   ├── /investigations            (investigation list/history)
│   ├── /investigations/new        (canonical replacement for /intake)
│   ├── /reports                   (report library)
│   ├── /reports/[reportId]        (canonical replacement for /report?reportId=)
│   ├── /monitoring                (watchlist monitoring)
│   ├── /billing                   (new if upgrades/payments remain visible)
│   └── /account
├── legal
│   ├── /privacy
│   └── /terms
└── internal
    └── /admin                     (admin-only, not public navigation)
```

## Page Definitions

### `/`: Homepage

- **Purpose:** Explain ShadowScore's premium risk-intelligence promise and drive visitors to start an investigation or sign in.
- **Primary user:** New seller/operator evaluating ShadowScore.
- **Entry points:** Direct traffic, SEO, social links, referrals.
- **Exit points:** `/investigations/new`, `/signup`, `/login`, `/about`, `/security`, `/contact`.
- **Authentication:** Public.
- **Relationships:** Parent of public acquisition journey; should not duplicate full intake functionality beyond one hero CTA.

### `/about`: About ShadowScore

- **Purpose:** Explain positioning, independence, and marketplace/payment focus.
- **Primary user:** Prospective customer or trust reviewer.
- **Entry points:** Footer, public company nav, homepage trust sections.
- **Exit points:** `/security`, `/contact`, `/investigations/new`.
- **Authentication:** Public.
- **Relationships:** Public trust/support page.

### `/security`: Security & Trust

- **Purpose:** Reassure users that marketplace passwords are not required and clarify safe evidence handling.
- **Primary user:** Risk-conscious prospect, customer, legal/security evaluator.
- **Entry points:** Footer, signup, intake evidence upload context.
- **Exit points:** `/privacy`, `/terms`, `/contact`, `/investigations/new`.
- **Authentication:** Public.
- **Relationships:** Public trust page that supports conversion.

### `/contact`: Contact / Analyst Inquiry

- **Purpose:** Provide human support or analyst/sales inquiry path.
- **Primary user:** Prospect, customer needing guidance, enterprise lead.
- **Entry points:** Footer, public pages, locked/complex states.
- **Exit points:** Email/contact channel, `/investigations/new`.
- **Authentication:** Public.
- **Relationships:** Support/sales escape hatch.

### `/pricing`: Pricing & Plans (New)

- **Purpose:** Explain free preview vs paid report vs monitoring/admin-grade features.
- **Primary user:** Prospect deciding whether to pay; signed-in user encountering locked report.
- **Entry points:** Homepage CTA, locked report state, navigation, `/upgrade` redirect.
- **Exit points:** `/signup`, `/investigations/new`, checkout/unlock flow.
- **Authentication:** Public with signed-in personalization optional.
- **Relationships:** Should absorb `/upgrade`.

### `/login`: Sign In

- **Purpose:** Authenticate existing users.
- **Primary user:** Returning customer.
- **Entry points:** Header, protected route redirect, report link redirect.
- **Exit points:** Return-to destination or `/workspace`.
- **Authentication:** Public route that should redirect authenticated users away.
- **Relationships:** Auth gateway for app routes.

### `/signup`: Create Account

- **Purpose:** Register a user and capture legal acceptance.
- **Primary user:** New customer who wants saved investigations/reports.
- **Entry points:** Homepage, pricing, locked states, login.
- **Exit points:** `/workspace` or return-to investigation/report.
- **Authentication:** Public route that should redirect authenticated users away.
- **Relationships:** Auth gateway and legal acceptance capture point.

### `/workspace`: Workspace Home

- **Purpose:** Signed-in product command center with recent activity, key metrics, next action, and account status.
- **Primary user:** Authenticated customer.
- **Entry points:** Login/signup success, app header, protected-route fallback.
- **Exit points:** `/investigations/new`, `/investigations`, `/reports`, `/monitoring`, `/account`.
- **Authentication:** Required.
- **Relationships:** App root. Should replace `/dashboard` as canonical.

### `/investigations`: Investigation List / History

- **Purpose:** Show submitted targets, scan modes, statuses, evidence needs, and next actions.
- **Primary user:** Authenticated customer managing cases.
- **Entry points:** App nav, workspace cards, report lifecycle states.
- **Exit points:** `/investigations/new`, `/reports/[reportId]`, `/monitoring`, `/contact`.
- **Authentication:** Required for history; public users should be directed to `/investigations/new` or signup.
- **Relationships:** Parent collection for investigation lifecycle.

### `/investigations/new`: New Investigation

- **Purpose:** Start a website/business, marketplace/seller, or evidence-review investigation.
- **Primary user:** Prospect or authenticated customer.
- **Entry points:** Homepage, header CTA, workspace, empty states.
- **Exit points:** Preview result, signup/login, payment/unlock, `/workspace`.
- **Authentication:** Public preview allowed; account required to save/unlock.
- **Relationships:** Canonical replacement for `/intake`.

### `/reports`: Report Library

- **Purpose:** List ready, pending, locked, and failed reports with filters and status explanations.
- **Primary user:** Authenticated customer.
- **Entry points:** App nav, workspace metrics, investigation completion.
- **Exit points:** `/reports/[reportId]`, `/investigations/new`, `/billing`, support.
- **Authentication:** Required.
- **Relationships:** Parent collection for paid/unlocked output.

### `/reports/[reportId]`: Report Detail

- **Purpose:** Show decision, identity profile, evidence hierarchy, timeline, and technical details for one report.
- **Primary user:** Customer reviewing a paid/unlocked report.
- **Entry points:** Report library, workspace recent reports, direct shared deep link after auth.
- **Exit points:** `/reports`, `/workspace`, `/monitoring`, `/contact`, export/download if available.
- **Authentication:** Required for private reports.
- **Relationships:** Detail child of reports collection; replaces `/report?reportId=`.

### `/monitoring`: Monitoring / Watchlist

- **Purpose:** Manage ongoing watchlist entities and risk status changes.
- **Primary user:** Customer with recurring risk needs.
- **Entry points:** App nav, workspace watchlist panel, report next steps.
- **Exit points:** `/reports`, `/investigations/new`, `/billing`, `/contact`.
- **Authentication:** Required.
- **Relationships:** Premium/retention product surface linked to reports and workspace.

### `/billing`: Billing & Plan (New)

- **Purpose:** Explain plan, paid reports, invoices/payment status, and upgrade path.
- **Primary user:** Authenticated customer.
- **Entry points:** Account, locked report, workspace plan pill, pricing.
- **Exit points:** checkout/unlock, `/account`, `/reports`.
- **Authentication:** Required.
- **Relationships:** App account/billing support route.

### `/account`: Account Settings

- **Purpose:** Show profile, email, sign-out, security/account controls.
- **Primary user:** Authenticated customer.
- **Entry points:** App header account menu, workspace profile card.
- **Exit points:** `/workspace`, `/billing`, sign out.
- **Authentication:** Required.
- **Relationships:** User-level settings, not a primary product destination.

### `/privacy`: Privacy Policy

- **Purpose:** Explain collection, use, sharing, retention, legal acceptance records, and requests.
- **Primary user:** Prospect, customer, legal reviewer.
- **Entry points:** Footer, signup, security page.
- **Exit points:** `/terms`, `/contact`, `/signup`.
- **Authentication:** Public.
- **Relationships:** Legal support page.

### `/terms`: Terms

- **Purpose:** Explain informational-use limits, no guarantees, analytical opinions, evidence accuracy, refunds, liability.
- **Primary user:** Prospect, customer, legal reviewer.
- **Entry points:** Footer, signup, payment/legal acceptance.
- **Exit points:** `/privacy`, `/contact`, `/signup`.
- **Authentication:** Public.
- **Relationships:** Legal support page and acceptance dependency.

### `/admin`: Admin Console

- **Purpose:** Internal read-only operational visibility for users, intakes, payments, reports, providers, evidence, and system health.
- **Primary user:** ShadowScore operator/admin.
- **Entry points:** Direct internal link only.
- **Exit points:** `/workspace`, internal tooling.
- **Authentication:** Required and admin-authorized.
- **Relationships:** Internal route; should be hidden from customer IA.

## Recommended Merge / Remove / Rename Plan

### Merge

1. Merge `/dashboard` into `/workspace`; keep `/dashboard` as a redirect only if needed for backward compatibility.
2. Merge `/reports` dashboard duplicate into a real report library.
3. Merge `/investigations` intake duplicate into a real investigation list; move intake flow to `/investigations/new`.
4. Merge `/upgrade` into `/pricing` and/or `/billing` depending on signed-in status.
5. Merge `/admin-lite` into `/admin` or remove it once `/admin` has the necessary permission model.

### Remove or Redirect

1. Redirect `/intake` → `/investigations/new`.
2. Redirect `/report?reportId=` → `/reports/[reportId]` when dynamic routing exists.
3. Redirect `/dashboard` → `/workspace`.
4. Remove or archive `/analysis`, `/report/analysis`, `/radar`, `/leads`, and `/example-report` unless they have active marketing ownership.
5. If `/example-report` remains, rename to `/sample-report` and make it consistent with product claims.

### Rename

1. `Start Investigation` should replace `New Scan` in most user-facing CTAs.
2. `Dashboard` should become `Workspace` everywhere.
3. `Saved reports` should become `Reports`.
4. `Business watchlist` should become `Monitoring` or `Watchlist`, but choose one globally.
5. `Report lifecycle` should become `Investigation status` if it includes pending/locked pre-report states.

## Navigation Recommendations

### Public Header

- Logo → `/`
- Product → anchor/dropdown for `Investigations`, `Reports`, `Monitoring`
- Security → `/security`
- Pricing → `/pricing`
- Contact → `/contact`
- Sign In → `/login`
- Primary CTA → `Start Investigation` → `/investigations/new`

### Authenticated Header / App Shell

- Workspace → `/workspace`
- Investigations → `/investigations`
- Reports → `/reports`
- Monitoring → `/monitoring`
- Account menu → `/account`, `/billing`, Sign out
- Primary CTA → `New Investigation` → `/investigations/new`

### Footer

- Product: Start Investigation, Reports, Monitoring, Pricing
- Company: About, Security, Contact
- Resources: Help/Support or Sample Report if retained
- Legal: Privacy, Terms
- Connect: Social links

## Breadcrumb Recommendations

Add breadcrumbs on authenticated app pages:

- `Workspace`
- `Workspace → Investigations`
- `Workspace → Investigations → New Investigation`
- `Workspace → Reports`
- `Workspace → Reports → [Report Target]`
- `Workspace → Monitoring`
- `Workspace → Account`
- `Admin → Console` for internal route only

## CTA Recommendations

| Context | Primary CTA | Secondary CTA |
|---|---|---|
| Homepage | Start Investigation | View Security / Pricing |
| Empty workspace | Start first investigation | Learn how reports work |
| Investigation preview | Unlock full report | Save to workspace |
| Locked report | Unlock report | View pricing / contact analyst |
| No reports | Start investigation | View sample report if retained |
| Monitoring empty | Add watchlist entity | Start investigation |
| Account | Back to workspace | Billing / sign out |
| Error/access denied | Return to workspace | Contact support |

## Empty / Loading / Error / Locked State Recommendations

### Empty States

- Use one pattern: headline, explanation, primary action, secondary help link.
- Ensure empty reports do not live only inside the dashboard; expose them on `/reports`.
- Empty investigations should explain the difference between free preview, saved investigation, and paid report.

### Loading States

- Replace plain text loading messages with branded skeleton cards or progress steps.
- Use consistent copy: `Loading workspace…`, `Loading reports…`, `Preparing report…`.

### Error States

- Centralize access-denied and not-found patterns.
- For admin denial, avoid exposing environment variable names to users.
- Report not found should offer `Back to reports`, `Start new investigation`, and `Contact support`.

### Locked States

- Locked report copy should explain exactly what is locked, why, and what action unlocks it.
- Route locked states to `/pricing` or `/billing` depending on auth.
- Use the same visual locked card across report, monitoring, and billing-related surfaces.

## Authentication Flow Recommendations

1. Add return-to handling for protected routes so users go back to their intended report/workspace page after login.
2. Hide or reframe app-only nav for signed-out users; do not make public users discover protected routes by accident.
3. Redirect authenticated users away from `/login` and `/signup` to `/workspace` or return-to.
4. Require authentication for report detail pages; if public report sharing is desired later, create a separate share token route.
5. Standardize all protected route loading states and redirect copy.

## Priority Backlog

### P0: IA Stabilization

- Pick `/workspace` as the only app home.
- Make `/reports` and `/investigations` distinct collection pages.
- Move intake to `/investigations/new` and redirect `/intake`.
- Hide/remove legacy campaign pages from sitemap and navigation.

### P1: Premium SaaS Shell

- Add app breadcrumbs.
- Separate public header from authenticated app shell.
- Add account dropdown instead of primary `Account` nav item.
- Standardize empty/loading/error/locked states.

### P2: Conversion & Trust

- Add `/pricing` or merge `/upgrade` into a canonical pricing route.
- Add sample report only if it aligns with current private report positioning.
- Add support/help route or support panels for complex evidence/report interpretation.

## Acceptance Criteria for Sprint 1

- There is one canonical sitemap and one canonical noun for each major object.
- No top-level nav item routes to a duplicate page.
- Public and authenticated journeys are visibly distinct.
- Every app page has a clear parent/child relationship.
- Every empty, loading, error, and locked state has a next action.
- Legacy pages are either owned, renamed, redirected, or removed from the product IA.

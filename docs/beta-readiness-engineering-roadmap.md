# ShadowScore Beta Readiness Engineering Roadmap

**Status:** Official execution baseline  
**Planning horizon:** Sprint 2 through Sprint 4  
**Source:** [ShadowScore Beta Readiness](./shadowscore-beta-readiness.md)

## 1. Planning contract

This roadmap converts every Beta Readiness backlog item into issue-ready implementation work. No product code is included in this change. An issue can close only when its acceptance signal in the source backlog is demonstrated.

Effort uses the backlog scale: **S** is up to 2 focused days, **M** is 3 to 5 days, **L** is 1 to 2 weeks, and **XL** is multi-team or vendor-dependent. Labels identify the principal disciplines. Dependencies are blocking issue IDs, not informal sequencing suggestions.

## 2. Milestones

| Milestone | Goal | Exit focus |
| --- | --- | --- |
| Sprint 2: Coherence and commercial truth | Establish one truthful product, actor model, route map, and implementation contract. | No demo data, contradictory offer, anonymous signed-in state, or unowned customer route. |
| Sprint 3: Purchase and delivery confidence | Deliver a durable, recoverable purchase-to-report journey. | Verified entitlement, canonical Investigation, lifecycle management, access recovery, and reliable handoff. |
| Sprint 4: Premium beta validation | Validate quality, operations, accessibility, and evidence-led extensions. | Supported journeys pass customer, device, accessibility, security, and support review. |

## 3. Issue catalog

Create one GitHub Issue for each row. Use the title exactly as written, apply the listed milestone, size, and labels, then copy the source backlog acceptance signal into the issue acceptance section.

| Order | Issue | Title | Milestone | Size | Labels | Depends on |
| ---: | --- | --- | --- | :---: | --- | --- |
| 1 | BR-02 | Freeze the beta SKU and purchase promise | Sprint 2 | S | UI, Payments, Legal | None |
| 2 | BR-05 | Consolidate authentication and actor boundaries | Sprint 2 | L | Backend, Authentication | None |
| 3 | BR-34 | Reflect authentication across the public site | Sprint 2 | M | UI, Backend, Authentication | BR-05 |
| 4 | BR-01 | Remove demo records from authenticated routes | Sprint 2 | M | UI, Backend, Database | BR-05 |
| 5 | BR-04A | Design the canonical Investigation data and route contract | Sprint 2 | L | Backend, Database | BR-05 |
| 6 | BR-07 | Gate duplicate and internal product routes | Sprint 2 | M | UI, Backend, Authentication | BR-04A, BR-05 |
| 7 | BR-08 | Publish source and jurisdiction coverage | Sprint 2 | M | UI, Backend, Legal | BR-02 |
| 8 | BR-06 | Prepare counsel-reviewed policy set and acceptance contract | Sprint 2 | L | Backend, Database, Legal | BR-02, BR-05 |
| 9 | BR-12 | Define one production-backed Sample Executive Report | Sprint 2 | M | UI, Backend | BR-02, BR-08 |
| 10 | BR-13 | Approve the canonical Workspace information architecture | Sprint 2 | M | UI, Authentication | BR-04A, BR-07 |
| 11 | BR-33A | Design Investigation lifecycle UX, API, retention, and permissions | Sprint 2 | M | UI, Backend, Database, Authentication, Legal | BR-04A, BR-05, BR-06 |
| 12 | BR-35A | Design the global authenticated user menu | Sprint 2 | S | UI, Authentication | BR-13, BR-34 |
| 13 | BR-15A | Define design tokens and CTA hierarchy | Sprint 2 | M | UI | BR-02, BR-13 |
| 14 | BR-03A | Design the provider-neutral payment and entitlement state machine | Sprint 2 | L | Backend, Database, Payments | BR-02, BR-04A, BR-06 |
| 15 | BR-03B | Implement orders, attempts, events, and idempotent settlement | Sprint 3 | XL | Backend, Database, Payments, Performance | BR-03A |
| 16 | BR-04B | Implement canonical Investigation persistence and ownership | Sprint 3 | XL | Backend, Database, Authentication | BR-04A, BR-03A |
| 17 | BR-09 | Deliver the four-step Investigation intake | Sprint 3 | L | UI, Backend, Authentication | BR-02, BR-04B, BR-15A |
| 18 | BR-10 | Deliver order review, payment status, and receipt states | Sprint 3 | M | UI, Backend, Payments, Legal | BR-03B, BR-09 |
| 19 | BR-11 | Standardize Executive Report identity and handoff | Sprint 3 | M | UI, Backend, Legal | BR-04B, BR-08, BR-10, BR-12 |
| 20 | BR-33B | Implement archive, restore, and soft delete | Sprint 3 | L | UI, Backend, Database, Authentication | BR-04B, BR-13, BR-33A |
| 21 | BR-14 | Add password recovery and verification states | Sprint 3 | M | UI, Backend, Authentication | BR-05, BR-34 |
| 22 | BR-18 | Add Account to the Workspace shell | Sprint 3 | M | UI, Backend, Authentication | BR-13, BR-14 |
| 23 | BR-35B | Deliver the global authenticated user menu | Sprint 3 | M | UI, Backend, Authentication | BR-18, BR-35A |
| 24 | BR-19 | Standardize loading, empty, error, and locked states | Sprint 3 | M | UI, Backend | BR-09, BR-10, BR-11, BR-33B |
| 25 | BR-17 | Implement approved report print and sharing | Sprint 3 | M | UI, Backend, Authentication, Legal | BR-06, BR-11 |
| 26 | BR-25 | Instrument the canonical product funnel | Sprint 3 | M | UI, Backend, Database, Legal, Performance | BR-06, BR-09, BR-10, BR-11 |
| 27 | BR-15B | Apply the design system to canonical pages | Sprint 4 | L | UI | BR-15A, BR-19, BR-35B |
| 28 | BR-20 | Replace symbol icons with an accessible icon set | Sprint 4 | S | UI | BR-15A, BR-35B |
| 29 | BR-16 | Complete accessibility and responsive journey remediation | Sprint 4 | M | UI | BR-15B, BR-20 |
| 30 | BR-21 | Make Investigation search and filters URL-backed | Sprint 4 | M | UI, Backend, Performance | BR-04B, BR-19, BR-33B |
| 31 | BR-23 | Split Admin into role-specific operational modules | Sprint 4 | L | UI, Backend, Database, Authentication, Payments | BR-03B, BR-04B, BR-05, BR-33A |
| 32 | BR-24 | Publish security assurance and disclosure pages | Sprint 4 | M | UI, Authentication, Legal | BR-05, BR-06 |
| 33 | BR-22 | Consolidate Monitoring, Watchlist, and Alerts | Sprint 4 | L | UI, Backend, Database, Authentication, Payments | BR-03B, BR-04B, BR-21 |
| 34 | BR-26 | Add saved Business profiles and repeat-investigation shortcuts | Sprint 4 | L | UI, Backend, Database, Authentication | BR-04B, BR-09, BR-25 |
| 35 | BR-27 | Add controlled colleague sharing | Sprint 4 | XL | UI, Backend, Database, Authentication, Legal | BR-04B, BR-05, BR-17, BR-18 |
| 36 | BR-28 | Add saved searches and alert filters | Sprint 4 | M | UI, Backend, Database | BR-21, BR-22 |
| 37 | BR-29 | Add an in-product notification center | Sprint 4 | L | UI, Backend, Database, Authentication | BR-19, BR-22, BR-25 |
| 38 | BR-30 | Add organization roles and invitations | Sprint 4 | XL | UI, Backend, Database, Authentication, Legal | BR-05, BR-18, BR-27 |
| 39 | BR-31 | Add a personalized onboarding checklist | Sprint 4 | M | UI, Backend, Database | BR-19, BR-25 |
| 40 | BR-32 | Add evidence-approved payment providers | Sprint 4 | XL | UI, Backend, Database, Payments, Legal | BR-03B, BR-10, BR-25 |

BR-03, BR-04, BR-15, BR-33, and BR-35 are split into design and delivery issues because they cross milestone boundaries. Their parent backlog items close only when every child issue closes. Nice-to-have items BR-26 through BR-32 remain evidence-gated. Sprint 4 reserves a milestone, but implementation begins only after the validation trigger in the source backlog is met.

## 4. Required issue body

Each issue must contain these sections:

1. **Outcome:** Copy the outcome from the source backlog.
2. **Scope:** Name included customer surfaces, API operations, data changes, and operational work.
3. **Acceptance:** Copy the source acceptance signal and add testable journey cases.
4. **Permissions and privacy:** Name the actor, tenant boundary, administrator capability, retention rule, and audit event when applicable.
5. **Dependencies:** Link every blocking issue from the catalog.
6. **Validation:** List automated checks, manual journeys, accessibility checks, observability, and screenshots required to close the issue.
7. **Estimate:** Record S, M, L, or XL and revise only after a technical design review.

## 5. Product requirement details

### BR-33: Investigation lifecycle

**UX requirements**

- Provide Archive, Restore, and Delete actions in the Investigation list and detail view where appropriate.
- Require a confirmation dialog before deletion. State the affected Investigation and whether recovery is available.
- Update the list and counts immediately without a full page reload. Reconcile optimistic state with the server result and surface a specific recovery action on failure.
- Show an accurate first-use or no-results empty state after the last visible Investigation is removed.
- Separate active, archived, and deleted states. Restore returns an archived record to its prior authorized Workspace.

**API and data requirements**

- Model lifecycle state, archived timestamp, deleted timestamp, actor, reason, and immutable audit events.
- Archive, restore, and soft-delete operations must be idempotent and tenant-scoped.
- Default Delete to soft deletion. Define retention, purge, legal hold, linked report, payment, and evidence behavior before implementation.
- Permanent deletion requires an administrator permission or a separate explicit-confirmation policy. It must not be a side effect of the standard Delete action.

**Permission requirements**

- Define owner, organization member, support, and administrator capabilities in a reviewed matrix.
- Reauthorize every mutation on the server. Hidden UI is not an authorization control.
- Prevent lifecycle changes from bypassing report entitlement, billing history, audit retention, or legal hold rules.

### BR-34: Global authenticated experience

- Resolve authentication from the canonical server session on the landing page, public navigation, and shared header.
- Replace Sign In for authenticated users with the connected account and authenticated navigation.
- Provide Workspace, My Investigations, Account, and Sign Out actions.
- Preserve the authenticated session when a user moves between the Workspace and public pages.
- Cover direct navigation, refresh, multiple tabs, expired sessions, and logout with acceptance tests. A resolved signed-in session must never render anonymous navigation.

### BR-35: Global user menu

- Show the menu on every public and private page after authentication resolves.
- Use the profile image when available. Otherwise provide a deterministic accessible avatar.
- Show the account name or email plus Workspace, My Investigations, Account Settings, Billing, and Sign Out.
- Support keyboard navigation, focus return, outside-click dismissal, Escape, mobile layouts, loading, long identity text, and RTL.
- Use the same canonical actor and logout operation as every protected route.

## 6. Dependency policy and implementation order

Work follows the numeric order in the issue catalog unless independent owners can proceed without crossing an unresolved dependency. The critical path is:

`BR-02 and BR-05` → `BR-04A and BR-06` → `BR-03A` → `BR-03B and BR-04B` → `BR-09` → `BR-10` → `BR-11` → `BR-19` → `BR-15B` → `BR-16`.

Authentication coherence proceeds in parallel after BR-05:

`BR-05` → `BR-34` → `BR-13` → `BR-35A` → `BR-18` → `BR-35B`.

Investigation lifecycle work proceeds after its records and policy are approved:

`BR-04A, BR-05, and BR-06` → `BR-33A` → `BR-04B` → `BR-33B` → `BR-19 and BR-21`.

A dependent issue may be refined while blocked, but it cannot merge implementation that assumes an unapproved contract. Milestone review must confirm dependency closure, acceptance evidence, and updated estimates.

## 7. GitHub setup checklist

- Create milestones named exactly `Sprint 2: Coherence and commercial truth`, `Sprint 3: Purchase and delivery confidence`, and `Sprint 4: Premium beta validation`.
- Create labels `UI`, `Backend`, `Database`, `Authentication`, `Payments`, `Legal`, and `Performance`.
- Create one issue per catalog row and add its size to the title suffix or the repository's estimate field.
- Convert dependency IDs into linked blocking relationships after issue numbers exist.
- Keep this document as the ordered roadmap. GitHub tracks execution state, owners, and discussion.

GitHub issue creation requires a configured repository remote and authenticated GitHub integration. If either is unavailable, this catalog is the canonical import manifest. Do not invent issue URLs or imply that remote issues exist.

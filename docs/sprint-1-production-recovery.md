# Production Recovery Sprint 1

**Sprint length:** 10 working days, maximum

**Scope:** 8 implementation tasks

**Source epic:** [ShadowScore Production Recovery Roadmap](./production-recovery-roadmap.md)

**Sprint outcome:** A customer signs in, sees only persisted Investigations, moves through a simpler canonical navigation, and reads a clearer Executive Report. Authorized staff use one Admin entry point to find that report. Sign-out ends the server session.

## Sprint rules

- This is the only active delivery plan for the sprint. The recovery roadmap remains the program epic.
- The sprint ends after 10 working days. Incomplete work returns to the roadmap for reprioritization.
- Scope may be removed to protect the outcome. New tasks may enter only when they block an acceptance criterion below.
- Each task includes implementation, focused automated tests, review, and deployable migration or rollback instructions where applicable.
- Customer records, authorization, and audit behavior take priority over visual polish.

## Why this slice comes first

This sprint combines one narrow integrity repair with changes customers and staff can see immediately. It closes the smallest production blocker, removes fictional customer records, reduces navigation ambiguity, corrects purchase expectations, and improves the most important part of the report. It also gives staff one controlled path to locate a customer report.

The sprint does not attempt to complete any full roadmap workstream. Payment webhooks, asynchronous report generation, the full Investigation lifecycle, impersonation, Comp, provider expansion, PDF export, and production certification remain in the approved roadmap.

## Delivery order

| Order | Task | Workstreams | Effort | Planned window |
| --- | --- | --- | --- | --- |
| 1 | Lock the Sprint 1 Investigation and access contracts | A, B, G | 1 to 2 engineering days | Days 1 to 2 |
| 2 | End the complete session on sign-out | B | 1 to 2 engineering days | Days 1 to 3 |
| 3 | Persist and tenant-scope the canonical Investigation slice | A | 5 to 8 engineering days | Days 2 to 9 |
| 4 | Ship the canonical authenticated navigation and redirects | F | 2 to 3 engineering days | Days 2 to 6 |
| 5 | Standardize customer status and purchase expectation copy | C, F | 1 to 2 engineering days | Days 3 to 6 |
| 6 | Consolidate staff access into one Admin entry point | B, G | 2 to 3 engineering days | Days 2 to 6 |
| 7 | Add audited Admin report lookup and access | A, B, G | 3 to 4 engineering days | Days 5 to 9 |
| 8 | Make Executive Report actions specific and concise | D, E | 3 to 4 engineering days | Days 3 to 9 |

The estimates are engineering effort, not elapsed time. Tasks 2, 4, 5, 6, and 8 can run in parallel after Task 1. The planned scope is 18 to 28 engineering days. A team with three available engineers can complete it within the 10-day limit. If that capacity is unavailable, Tasks 5 and 8 remain the preferred scope cuts. Tasks 2, 3, 4, 6, and 7 protect the end-to-end sprint outcome.

## Implementation tasks

### Task 1: Lock the Sprint 1 Investigation and access contracts

**Description**

Approve the minimum persisted contract needed by this sprint. Define the Investigation identifier, customer and organization ownership, list and detail projections, report reference, and staff report-access event. Record the migration and rollback path. Keep broader lifecycle and payment decisions in the roadmap.

**Dependencies**

- Existing Investigation, report, profile-role, and organization-membership schemas.
- Production Recovery Roadmap Phase 0 rules.

**Estimated effort:** 1 to 2 engineering days.

**Acceptance criteria**

- One reviewed decision record defines the fields and authorization rules used by Tasks 3 and 7.
- The contract uses one Investigation ID for list, detail, and report lookup.
- Customer reads require active ownership or organization membership. Staff reads require an approved database role.
- Migration, rollback, and legacy-record exception handling are documented before schema changes merge.
- The decision record leaves payment, Comp, impersonation, archive, and full lifecycle contracts outside this sprint.

### Task 2: End the complete session on sign-out

**Description**

Add a server-owned sign-out operation. It revokes the Supabase session, clears the authentication cookie with matching attributes, clears the client session view, and returns the customer to the signed-out navigation state.

**Dependencies**

- Task 1 access boundary.
- Current login cookie and Supabase session behavior.

**Estimated effort:** 1 to 2 engineering days.

**Acceptance criteria**

- The Account sign-out action waits for the server response before presenting the signed-out state.
- The authentication cookie is absent after sign-out and the refresh session is revoked.
- A direct request to each protected page and API used in this sprint returns unauthorized after sign-out.
- Browser back, refresh, and a copied protected URL do not reveal protected customer data.
- Automated coverage proves the old session cannot read an Investigation or report.

### Task 3: Persist and tenant-scope the canonical Investigation slice

**Description**

Replace the production memory repository and hardcoded actor on the canonical Investigation list, create, and detail paths. Use Supabase persistence and the authenticated customer or organization scope. Keep deterministic seeded Investigations in tests only.

**Dependencies**

- Task 1 contract and migration plan.
- Task 2 server session behavior for authenticated requests.

**Estimated effort:** 5 to 8 engineering days.

**Acceptance criteria**

- Creating an Investigation writes a durable record associated with the authenticated scope.
- List and detail views read the same persisted record and use the same Investigation ID.
- Records remain available after a server process restart or redeploy simulation.
- A second tenant receives neither the record nor its identifying fields through the page or API.
- Production customer routes contain no seeded Investigations, fixed scores, fixed evidence, or hardcoded customer actor.
- Migration and rollback are rehearsed against a non-production database, and exceptions are recorded for review.

### Task 4: Ship the canonical authenticated navigation and redirects

**Description**

Use one authenticated menu with Investigations, Archive, Account, and Start Investigation. Remove customer links to parallel product areas. Redirect the legacy customer entry routes included in the route inventory to their canonical destinations.

**Dependencies**

- Task 1 route ownership decision.
- Existing public and authenticated shell inventory.

**Estimated effort:** 2 to 3 engineering days.

**Acceptance criteria**

- Every authenticated page in this sprint displays the same menu and primary action.
- Security appears once in each applicable navigation context.
- Selecting the current navigation item resolves to its canonical URL and remains usable.
- Dashboard, Workspace, Reports, and Cases customer bookmarks redirect to the approved Investigations or Archive destination without a redirect loop.
- Back, forward, refresh, and a validated post-login return path preserve the canonical destination.
- Keyboard focus and the active-item label are correct at desktop and mobile breakpoints.

### Task 5: Standardize customer status and purchase expectation copy

**Description**

Apply one compact set of empty, loading, unauthorized, expired-session, payment-pending, generation-pending, recoverable-error, and terminal-error states to the Investigation and report journey. Correct current checkout and report copy so it names PayPal as the available payment method and describes delivery, retention, and download behavior that the product currently supports.

**Dependencies**

- Task 4 canonical destinations.
- Verified current payment, delivery, retention, and export behavior.

**Estimated effort:** 1 to 2 engineering days.

**Acceptance criteria**

- Customers can distinguish an empty account, expired session, pending payment, pending generation, recoverable failure, and terminal failure.
- Each state provides one appropriate next action and a support reference when no self-service recovery exists.
- Checkout names only enabled payment methods.
- Delivery, retention, and download statements match verified product behavior.
- Edited copy uses Executive Report and Investigation consistently and passes the human writing review.

### Task 6: Consolidate staff access into one Admin entry point

**Description**

Make `/admin` the single staff entry point for this sprint. Enforce database-role authorization on the server. Redirect `/admin-lite` to `/admin`, and remove the public email allowlist and client-only authorization decisions from the active path.

**Dependencies**

- Task 1 staff access contract.
- Current database profile roles.

**Estimated effort:** 2 to 3 engineering days.

**Acceptance criteria**

- An anonymous user and a normal customer receive no Admin content from the route or its APIs.
- An authorized staff role can open `/admin` directly without a client-side authorization flash.
- `/admin-lite` redirects to `/admin` and exposes no separate staff data or actions.
- Changing or removing the staff database role takes effect within the documented session interval.
- Automated tests cover anonymous, customer, authorized staff, and revoked-role access.

### Task 7: Add audited Admin report lookup and access

**Description**

Add a focused Admin report finder backed by a server endpoint. Authorized staff can search by Investigation ID, report ID, or exact customer identifier and open one report. Every open records the staff actor, customer scope, Investigation, report, purpose, and time.

**Dependencies**

- Tasks 1, 3, and 6.
- Existing administrator report-access service and audit storage.

**Estimated effort:** 3 to 4 engineering days.

**Acceptance criteria**

- An authorized staff member can find and open every report represented by the Sprint 1 contract without changing customer ownership.
- The endpoint returns only the selected report projection. It does not hydrate an entire customer workspace.
- Opening a report requires a non-empty support purpose and creates an immutable access event.
- The access event contains both the staff actor and customer scope, plus Investigation ID, report ID, purpose, and timestamp.
- A normal customer, a revoked staff member, and an identifier-tampering request receive no report data.
- The Admin interface provides clear empty, unauthorized, and lookup-failure states.

### Task 8: Make Executive Report actions specific and concise

**Description**

Improve the customer-visible recommendation section without redesigning the full reasoning pipeline. Map existing material findings into at most three decision-critical actions. Each action states the owner, timing, evidence required, pass condition, and residual risk. Remove duplicate fallback actions from the executive view.

**Dependencies**

- Existing canonical report fixture set and report composition path.
- Product or risk review availability during the sprint.

**Estimated effort:** 3 to 4 engineering days.

**Acceptance criteria**

- The executive view presents no more than three actions, ordered by commercial materiality.
- Every action includes owner, timing, required evidence, pass condition, and residual risk.
- The same control is not repeated as both a finding-specific and generic fallback action.
- Actions reference existing findings and do not introduce new facts, scores, or outcomes.
- Golden fixtures cover strong evidence, sparse evidence, contradictory evidence, and provider failure.
- Product or risk review approves the fixture output for clarity, factual support, and usefulness.

## Sprint acceptance journey

Sprint 1 is accepted only when the following journey passes in a production-like environment:

1. Customer A signs in and sees the canonical authenticated navigation.
2. Customer A creates an Investigation and retrieves the same ID from list and detail after a process restart.
3. Customer B cannot discover or open Customer A's Investigation.
4. Customer A opens an available Executive Report and sees no more than three specific actions.
5. Authorized staff finds that report through `/admin`, supplies a support purpose, and creates an immutable access event.
6. A normal customer cannot use the same Admin route or endpoint.
7. Customer A signs out. Refresh, browser back, and direct protected requests remain unauthorized.

## Definition of done

- All eight tasks meet their acceptance criteria, or an approved scope cut is recorded before the sprint review.
- The Sprint 1 acceptance journey passes with recorded test evidence.
- Database changes include forward migration, rollback instructions, and tenant-isolation verification.
- New server mutations and reads enforce authorization at the server boundary.
- Customer-visible states pass keyboard, responsive, and copy review.
- No P0 or P1 claim is marked closed beyond the exact acceptance proven in this sprint.
- The sprint review demonstrates the customer journey and Admin report lookup from deployed code.

## Sprint review measures

- Zero seeded or cross-tenant Investigation records on canonical customer routes.
- Zero successful protected requests after completed sign-out.
- One canonical authenticated menu across every route in the acceptance journey.
- One audited Admin access event for every staff report open.
- No more than three decision-critical actions in the Executive Report fixture set.
- Median report lookup time during the staff review is under two minutes.

## Explicitly deferred

The following work stays in the Production Recovery Roadmap and is not part of Sprint 1:

- PayPal webhook settlement, reconciliation, refunds, disputes, and asynchronous Investigation jobs.
- Stripe and CardCom implementation.
- Full session refresh architecture and the complete protected-route migration.
- Full Investigation lifecycle, Archive lifecycle, migration of every legacy record, and report version history.
- Comp, impersonation, recovery controls, role matrix expansion, and the full Admin dashboard.
- Canonical Decision redesign, semantic evidence deduplication, provider coverage expansion, and observed provider health.
- Headline score policy, PDF export, sharing, and retention implementation.
- Complete localization, accessibility certification, performance budgets, and production certification.

Sprint 2 will be planned only after the Sprint 1 review records completed work, remaining risk, measured capacity, and customer feedback.

# Release Notes

## Live intelligence collection and orchestration

- The customer journey now keeps the Free Quick Check separate from the $9.90 Business Investigation. Intake preserves the Quick Check, confirms the paid scope and customer, and sets the Executive Report expectation after payment and processing.

- Quick Check now queries the production-safe provider inventory for domain registration, DNS, TLS, threat reputation, website identity, payment, policy, and contact evidence. It reports all ten decision categories, keeps missing categories marked as not verified, and limits the score when source coverage or identity evidence is weak.
- Investigations can now start from one email or domain and collect traceable DNS evidence from Google Public DNS.
- A bounded discovery loop controls depth, duplicate work, provider calls, retries, timeouts, and investigation cost.
- Marketplace provider capabilities are explicit. Credentialed marketplace collection remains unavailable until a partner client is configured, and the system never substitutes fixture evidence.
- Collected evidence now flows directly into entity resolution, contradiction analysis, confidence scoring, marketplace correlation, and the final decision graph.

This file records customer-visible improvements in each ShadowScore release.

## Current beta

### New

- Investigation graphs now correlate company, domain, contact, and marketplace identities in one evidence trail. Exact identifiers drive entity resolution, while contradictions, evidence freshness, and source confidence shape a decision and its next action.
- Workspace for authenticated investigations.
- Authentication with a preserved return path after signup or login.
- Investigation intake, checkout, payment, processing, and report flow.
- Investigation queue and administrative report access.

### Improved

- Pricing now leads with the purchasable Business Investigation, explains the five-step purchase and investigation flow, details the Executive Report, and answers practical purchase questions. Team paths remain available in a compact secondary section.

- Pricing now presents the canonical $9.90 Business Investigation without internal review messaging. The shared product contract and all other customer journeys remain unchanged.

- The current beta restores the exact approved ShadowScore infinity mark across the public site, workspace, and browser icon. The original SVG geometry, gradients, metadata, accessibility text, and asset names remain unchanged.

- Enterprise readiness review mode now adds a consistent trust checkpoint strip across the product shell and includes Account in authenticated navigation for easier procurement-style demos.

- The Platform and About pages now share the current ShadowScore visual system, factual product language, clear return navigation, and a consistent path from company context to sample report and investigation.

- Product transitions, loading placeholders, empty states, error states, hover feedback, focus visibility, and action notifications now share one responsive and reduced-motion-aware interaction system.

- Pricing, checkout, sample-report, homepage, and workspace references now use one commercial catalog for the individual investigation, Professional, Business, and Enterprise paths.
- The authenticated workspace now includes a direct route to the public ShadowScore website, so customers can move between product and account contexts without reaching a dead end.

- The new Account Center brings profile identity, organization access, commercial entitlements, purchased report paths, security information, and support into the authenticated workspace.

- Pricing now explains the complete one-time investigation purchase, processing expectations, and report deliverable. It also presents clearly labeled Professional, Business, and Enterprise plan directions without implying that subscriptions are available.

- Executive Reports now open inside the authenticated workspace with one navigation system, clear access status, and a decision-focused export toolbar.

- The processing experience now tells the investigation story in real time. It shows the active intelligence operation, why each stage matters, how confidence develops, and when the executive decision is ready.

- The authenticated workspace now uses the ShadowScore brand, polished navigation icons, clearer active states, shared component sizing, and visible security, support, and system-status cues across desktop and mobile.

- Unified public and authenticated navigation around the ShadowScore platform, workspace, investigation, and report model. The shared shell now uses one visual system, clearer location cues, and consistent primary actions across desktop and mobile.

- The sample report now presents one Business Investigation narrative, complete report identity and service boundaries, and a clear enterprise evaluation path without positioning the self-service price as the platform ceiling.
- The sample report now opens with an executive decision brief, traces evidence into a recommended control, and explains the exact $9.90 deliverable before purchase.
- The homepage now explains the decision outcome, input, analysis, and Executive Report at a glance, with an illustrative decision preview that shows how evidence becomes a practical control.
- Terms and Privacy now include responsive section navigation, semantic lists, direct contact routes, and links between both policies.
- Public pages now restore account navigation from the secure server session, including after a new tab or browser refresh.
- Customers can now archive completed investigations, restore them to the Workspace, and permanently delete archived records with confirmation and clear status feedback.
- The Beta Candidate release gate now covers one connected purchase, report, return, profile, archive, restore, and deletion journey.
- Signed-in customers now see a clear account menu across the public website, with direct paths to their workspace and profile on desktop and mobile.
- Public navigation now confirms account status without a hydration mismatch and provides keyboard-accessible sign-out controls.
- The workspace now supports confirmed investigation deletion, clear success and error feedback, and a focused first-investigation empty state.
- Sprint 2.2 introduces one visible investigation progress model from intake through review, payment, processing, and the Executive Report.
- Executive Reports now include an accessible risk visualization, evidence navigation, secure link sharing, and a focused PDF export action.
- Review, payment, and processing screens now use consistent breadcrumbs, trust details, recovery actions, and report availability language.
- Consistent navigation across the customer workspace.
- Server-side payment verification before report access is granted.
- Session continuity during the signup and checkout flow.
- Product terms and privacy information in the purchase experience.

### Fixed

- Production checks now run without legacy page copies or lint warnings from inactive source files.
- The investigation purchase summary and unlock action now use the same canonical product name and price.
- Workspace investigation and recent report links now preserve the persisted investigation reference and resolve the associated report record before opening it.
- Route validation now recognizes public assets, includes the ShadowScore infinity brand mark, and removes inert monitoring and brand actions from customer-facing screens.
- Case, investigation, watchlist, entity intelligence, and homepage controls now declare explicit button intent for safer keyboard and form behavior.

- The account center now provides a direct sign-out action, and release checks cover current price and secure report-sharing copy.
- The application root renders each page once inside the locale and product feedback providers.
- Investigation deletion now validates workspace ownership before removal, clears server caches after lifecycle changes, and synchronizes the Workspace automatically when a request fails.
- Guest investigations now resume after account creation.
- Payment completion is tied to the purchased report.
- Verified payments now start report generation without relying on browser polling.
- Report routes now require paid and ready states.

- Fixed production brand rendering so headers, account entry points, workspace, intake, favicon, social metadata, and organization schema use the canonical ShadowScore logo asset.
## 2026-08-11

- Fixed account confirmation and Workspace session handoff for new customers.
- Added automatic recovery for accounts missing a Workspace membership.
- Moved administrator console authorization to the persisted Supabase profile role.

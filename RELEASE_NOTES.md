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

- Email, domain, and URL investigations now preserve the submitted target, discover bounded first-party pages and sitemaps, and show evidence-backed resolved entities in the Executive Report.

- Investigation graphs now correlate company, domain, contact, and marketplace identities in one evidence trail. Exact identifiers drive entity resolution, while contradictions, evidence freshness, and source confidence shape a decision and its next action.
- Workspace for authenticated investigations.
- Authentication with a preserved return path after signup or login.
- Investigation intake, checkout, payment, processing, and report flow.
- Investigation queue and administrative report access.

### Improved

- Entity discovery now prioritizes person, company, domain, and canonical profile clues. It rejects generic result-title noise and reserves search capacity for graph-neighbor investigation.

- Entity investigations now enrich person, username, profile, email, domain, and company clues through bounded graph-neighbor searches. Administrator reports include the query trace and budget outcome.

- Identity discovery now follows bounded social handles and useful profile names across three hops. URL and title leads retain their full evidence path and remain candidate-only until independent evidence supports attribution.

- Investigation Workspace now lets customers select or clear every investigation shown by the current search and filter before bulk deletion.

- The Free Quick Check now presents the submitted target, truthful identity status, preliminary assessment, representative evidence and sources, material findings, and unresolved evidence gaps before explaining the Full Investigation.

- Shared links now use a code-generated ShadowScore social card with clear due diligence positioning for messaging and professional networks.

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

- Business investigations now keep curated company knowledge out of legal identity, jurisdiction, company type, confidence, corroboration, and decision results. Only collected provider evidence can establish those facts.
- Website investigations now exclude optional DNS record absence and unrelated provider checks from material evidence gaps across correlation, investigation intelligence, and the final decision.
- Business identity correlation now compares like attributes, so a company name and its domain no longer create a false identity conflict or high-severity risk.

- Completed Quick Checks now continue to the existing review and payment step after the investigation is saved.

- Investigation deletion now uses one tenant-scoped database operation, so deleted investigations stay removed after the workspace refreshes.
- Signed-in customers can now save a Quick Check intake and reach checkout through the secure server session. Investigation deletion now reports success only after the database confirms the owned row was removed.
- Shared homepage previews now use one absolute, cacheable PNG URL for WhatsApp, Meta, LinkedIn, and X crawlers.
- Signup and login now run through same-origin server routes. Secure server-owned cookies handle session refresh and logout, and the admin console verifies the authenticated database role on both the page and API boundaries.
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
- Bulk investigation deletion now keeps filtered selections safe and preserves actionable retry details when only some deletions succeed.

# August 18, 2026

- Hardened first-party entity discovery with DNS validation, pinned public network connections, and manual validation of every redirect. Added evidence-backed Hebrew person and professional role extraction for multilingual business pages.
- First-party reports now prioritize an explicitly submitted page, reject dates and unrelated structured-data names as resolved entities, and distinguish unavailable, partial, and empty evidence coverage.

# August 19, 2026

- First-party discovery now accepts normalized IPv4 and IPv6 resolver responses while rejecting malformed or private destinations. Provider collection failures now require further investigation instead of producing a blocking decision.
# 2026-08-20

- Email investigations now keep public mailbox providers separate from the investigated identity. Public search candidates, profile links, match reasons, confidence, status, and evidence provenance are visible in the Executive Report.

## Identity expansion graph

- Identity discovery now expands only explicit aliases, retains every alias observation, and keeps all Brave search results at candidate status until an independent source corroborates them.
- Saved reports with the earlier identity candidate format continue to render, and corporate email reports retain domain-specific actions.

- Email identity investigations now follow bounded, evidence-backed aliases across public profiles.
- Executive reports show the discovery path, confidence, matched identifiers, and supporting evidence for ranked identity candidates.
- Submitted input echoes no longer count as independent corroboration. Recommendations for personal email investigations now focus on identity evidence.

# 2026-08-21

- Investigations now distinguish leads, observations, corroborated evidence, and verified evidence. Decisions require verified subject evidence and independent source families.
- Public mailbox investigations no longer collect or inherit mailbox-provider infrastructure. Corporate email investigations can still expand into their business domain while retaining the submitted email as the original target.
- Provider integrations now declare capabilities, legal basis, source family, availability, and required credentials across identity, phone, registry, business, domain, regulatory, reputation, marketplace, and payment intelligence.
- Connected configured Brave Search discovery to live investigations. Reports now distinguish executed, unavailable, timed out, and failed providers, and retain query, result, snippet, hop, lineage, timestamp, source-family, and confidence provenance.
- Scoped transaction decisions to verified evidence for the submitted subject. Derived mirrors count with their originating source family, and missing independent coverage is reported explicitly.

# 2026-08-22

- Identity discovery now keeps the submitted target in contextual follow-up searches, extracts useful name tokens, rejects social discovery pages and generic titles, and ranks relevant multi-hop profile leads ahead of noisy first-hop results.
- Investigation metadata now records each identity search, its pivot and hop, original target context, result count, and whether it produced a new identifier.
- Identity discovery now uses unused expansion capacity for remaining seed searches and recognizes names with lowercase particles and writing systems without letter case.
- Open-web identity enrichment now follows strong person, username, company, and domain clues across editorial, company, registry, directory, and social sources. Labeled fields stop at sentence boundaries, while locations and role titles remain graph context instead of consuming the search budget. Search diagnostics identify intent, source class, extracted clues, and ranking rationale while third-party handles remain candidates.

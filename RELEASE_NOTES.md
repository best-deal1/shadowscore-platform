# Release Notes

This file records customer-visible improvements in each ShadowScore release.

## Current beta

### New

- Workspace for authenticated investigations.
- Authentication with a preserved return path after signup or login.
- Investigation intake, checkout, payment, processing, and report flow.
- Investigation queue and administrative report access.

### Improved

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

- Investigation deletion now validates workspace ownership before removal, clears server caches after lifecycle changes, and synchronizes the Workspace automatically when a request fails.
- Guest investigations now resume after account creation.
- Payment completion is tied to the purchased report.
- Verified payments now start report generation without relying on browser polling.
- Report routes now require paid and ready states.

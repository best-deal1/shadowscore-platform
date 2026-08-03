# Release Notes

This file records customer-visible improvements in each ShadowScore release.

## Current beta

### New

- Workspace for authenticated investigations.
- Authentication with a preserved return path after signup or login.
- Investigation intake, checkout, payment, processing, and report flow.
- Investigation queue and administrative report access.

### Improved

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

- Guest investigations now resume after account creation.
- Payment completion is tied to the purchased report.
- Verified payments now start report generation without relying on browser polling.
- Report routes now require paid and ready states.

# Release Notes

This file records customer-visible improvements in each ShadowScore release.

## Current beta

### New

- Workspace for authenticated investigations.
- Authentication with a preserved return path after signup or login.
- Investigation intake, checkout, payment, processing, and report flow.
- Investigation queue and administrative report access.

### Improved

- Consistent navigation across the customer workspace.
- Server-side payment verification before report access is granted.
- Session continuity during the signup and checkout flow.
- Product terms and privacy information in the purchase experience.

### Fixed

- Guest investigations now resume after account creation.
- Payment completion is tied to the purchased report.
- Verified payments now start report generation without relying on browser polling.
- Report routes now require paid and ready states.

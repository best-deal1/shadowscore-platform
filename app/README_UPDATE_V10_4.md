# ShadowScore V10.4 Checkout Modal Fix

Copy these files into your project:

- app/page.tsx
- components/PaymentButtons.tsx
- components/ShadowScoreLayout.tsx

Fixes:
- Checkout no longer expands inside the pricing card.
- Checkout now opens as a centered modal overlay.
- Modal can be closed.
- Clicking inside the modal does not trigger pricing card click.
- Pricing card keeps a clean Open Checkout button only.
- Added/kept © 2026 ShadowScore. Marketplace Trust Intelligence. All rights reserved.
- Console remains in nav.
- Leads removed from nav.
- Exposure remains instead of Recovery.
- Referral logic remains active.

Push:
npm run build
git add .
git commit -m "ShadowScore V10.4 checkout modal fix"
git push origin main

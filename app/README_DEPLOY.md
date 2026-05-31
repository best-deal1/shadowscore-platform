# ShadowScore V3.2 Enterprise

Changes:
- Restored marketplace coverage visual section
- Added marketplace logo rail style blocks
- Added case intelligence for MC011, MC999, Payout Hold, Verification
- Stronger enterprise language
- Removed inflated numeric counters
- Kept $49, $99, $199, $299
- Removed Agency plan from homepage grid to reduce clutter
- More Palo Alto / CrowdStrike / Check Point feel

Copy:
- app/page.tsx
- app/intake/page.tsx

Then test:
npm run build

Push:
git add .
git commit -m "Upgrade ShadowScore V3.2 enterprise positioning"
git push origin main

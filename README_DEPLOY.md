# ShadowScore v10 Marketplace and Payout Intelligence Update

Changes included:
- Hero repositioned to Marketplace & Payout Risk Intelligence.
- Primary platforms focused on eBay, Amazon, Walmart, Etsy and TikTok Shop.
- SHEIN, Vinted, Depop, Facebook Marketplace and Shopify moved to research / coming soon.
- PayPal, Payoneer and Stripe positioned as connected payment-risk systems.
- Payout Risk upgraded with deferred settlement, withdrawal freeze and Payoneer compliance review.
- Reputation Risk added for low product ratings, complaints and return patterns.
- TikTok deferred settlement case added to the intelligence feed.
- CTA changed to Scan My Marketplace Risk.
- Intake now supports Payoneer evidence requirements.
- Intake now detects product rating, deferred settlement and withdrawal signals.

Deploy:
```bash
npm run build
npm run lint
git add .
git commit -m "Upgrade ShadowScore v10 marketplace payout intelligence"
git push origin main
```

## v10.2 Other Marketplace Intake Update
- Added `Other` to the Intake marketplace selector.
- When `Other` is selected, a custom marketplace name field opens.
- The scan result and saved lead use the custom marketplace name instead of showing only `Other`.
- Added generic evidence requirements for unlisted marketplaces, payment providers and commerce platforms.

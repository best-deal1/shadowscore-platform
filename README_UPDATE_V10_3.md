# ShadowScore V10.3 Update

Copy these files into your project:

- app/page.tsx
- components/PaymentButtons.tsx
- components/ShadowScoreLayout.tsx

Main changes:
- Removed the extra pricing CTA so checkout is not duplicated.
- Pricing now shows one professional Open Checkout button.
- Checkout includes PayPal, Card, Payoneer and Bank Transfer tabs.
- Referral links are supported with ?ref=partnername, ?partner=, ?affiliate= or ?utm_source=.
- Referral code is stored in localStorage and included in payment requests.
- Hero message is clearer for all marketplaces, not only eBay.
- Console remains in the public navigation.
- Leads remains removed from the public navigation.
- Exposure remains instead of Recovery.

Push commands:
npm run build
git add .
git commit -m "ShadowScore V10.3 checkout and referral update"
git push origin main

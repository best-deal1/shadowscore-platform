# ShadowScore V6.1 Risk Framework + Payments Update

What was updated:
- Green business-style WhatsApp CTA: "Talk With An Expert".
- Payment selector upgraded to branded payment tiles: PayPal, Credit Card, Payoneer, Bank Transfer.
- PayPal direct checkout remains active.
- Credit Card, Payoneer and Bank Transfer open secure WhatsApp payment requests.
- Marketplace coverage expanded beyond eBay: Amazon, Walmart, Etsy, TikTok Shop, SHEIN, Vinted, Facebook Marketplace, Shopify, PayPal and Stripe.
- Risk framework expanded to 8 categories:
  - Performance Risk
  - Policy Risk
  - Product Policy Risk
  - IP / VeRO Risk
  - Security Risk
  - Verification Risk
  - Supplier Risk
  - Payment Risk
- Added Marketplace Myth Busters section instead of fake testimonials.
- Intake engine expanded with requirements for Vinted, Facebook Marketplace, Shopify, PayPal and Stripe.
- Intake signals expanded for restricted products, adult categories, weapons, chargebacks, reserves and Vinted cases.
- Kept safe positioning: no internal marketplace access claims, no recovery guarantees, scoring logic remains private.

Files changed:
- app/page.tsx
- app/intake/page.tsx
- components/PaymentButtons.tsx
- components/ShadowScoreLayout.tsx

Deploy:
npm run build
git add .
git commit -m "Update ShadowScore V6.1 risk framework and payments"
git push origin main

# ShadowScore V8.1 Payment Patch

This patch fixes the payment section.

Included:
- PayPal logo displayed inside the payment button
- Payoneer logo displayed inside the payment button
- Green WhatsApp CTA button
- Credit card CTA
- Manual payment request fallback via email
- Public assets added under public/payments

Files changed:
- components/PaymentButtons.tsx
- public/payments/paypal-logo.png
- public/payments/payoneer-logo.png

Deploy:
```bash
npm run build
npm run lint
git add .
git commit -m "Fix ShadowScore payment buttons and logos"
git push origin main
```

Note:
Until live PayPal Checkout / Stripe Checkout is connected, the PayPal, Payoneer and credit-card buttons create a payment request by email. The WhatsApp button opens a direct WhatsApp request.

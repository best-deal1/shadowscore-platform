# ShadowScore V8.4 Checkout + Legal Cleanup

## Fixed
- Removed visible referral/debug language such as "Referral detected: partner".
- Renamed checkout wording to "Secure Payment Request".
- Made WhatsApp CTA more inviting: "Talk To A Marketplace Risk Analyst".
- Rebuilt PaymentButtons with clear PayPal and Payoneer logo buttons.
- Added clearer credit card payment button.
- Added legal disclaimer: ShadowScore does not provide legal advice, does not guarantee reinstatement, payment release, marketplace approval or business outcomes.
- Added user responsibility and limitation of liability language.
- Added no-credentials and independent-assessment language to Security.

## Deploy
npm run build
npm run lint
git add .
git commit -m "ShadowScore V8.4 checkout cleanup and legal disclaimer"
git push origin main

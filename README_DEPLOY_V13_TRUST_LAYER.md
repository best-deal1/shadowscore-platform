# ShadowScore V13 - Trust Layer Upgrade

## Main upgrade
This version shifts ShadowScore from a marketplace-only scanner toward a focused Trust Intelligence platform for digital sellers.

## Positioning
- Protect Revenue Before Problems Escalate
- Know Your Risk Before They Do
- Marketplace, Reputation and Financial Risk Intelligence
- Future direction: URL Intelligence Beta

## What changed
- Sharper hero messages
- Expanded risk framework to 12 categories
- Added Financial Risk instead of only Payout Risk
- Added Transparency Risk
- Added Payoneer, Stripe, Visa, Mastercard and Amex payment positioning
- Added URL Intelligence Beta section
- Updated FAQ to explain marketplace, payout and future URL intelligence
- Added info@shadowscore.io and help@shadowscore.io
- Updated About, Privacy, Terms, Security and Contact pages
- Updated footer and support wording
- Kept no fake testimonials and no recovery promises
- Kept focus on professional sellers in US, Canada, UK and Europe

## Important
The PayPal checkout email is set to info@shadowscore.io.
Before production, make sure this email is verified as a PayPal business account.
If it is not verified, replace PAYPAL_BUSINESS_EMAIL in lib/config.ts with the verified PayPal account email.

## Deploy
npm run build
npm run lint
git add .
git commit -m "Upgrade ShadowScore V13 trust layer"
git push origin main

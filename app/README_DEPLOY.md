# ShadowScore v11 Revenue & Trust Intelligence

## Main fixes
- Fixed wrong WhatsApp number in Contact page.
- Added shared config file at lib/config.ts so all WhatsApp links use the same number.
- Payment buttons and contact links now share the same WhatsApp destination.

## Product updates
- Added rotating hero messages based on the latest research:
  - Most sellers monitor sales. Marketplaces monitor risk.
  - Above Standard doesn't mean Safe.
  - The suspension is the result, not the beginning.
  - Payouts frozen means the risk started earlier.
  - See the marketplace blind spot before revenue is impacted.

## Intake engine updates
- Rebuilt Free Scan page with stronger validation.
- Blocks unsupported file types.
- Blocks files under 1KB or above 15MB.
- Flags low-confidence evidence names instead of blindly scoring garbage.
- Requires at least one valid file before running a scan.
- Adds platform-specific requirements for eBay, Amazon, Walmart, Etsy, TikTok Shop, PayPal, Payoneer and Stripe.
- Adds preliminary Health Stage and Risk Score.
- Adds findings, severity and recommended action.

## Positioning
- Keeps ShadowScore as independent Marketplace & Payout Risk Intelligence.
- Does not claim access to internal marketplace systems.
- Does not promise account recovery, payout release or reinstatement.

## Deploy
npm run build
npm run lint
git add .
git commit -m "Upgrade ShadowScore v11 revenue and trust intelligence"
git push origin main

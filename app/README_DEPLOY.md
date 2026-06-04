# ShadowScore V10.2 Professional Checkout + Referral Links

Updated:
- Pricing checkout upgraded to a professional checkout card.
- One primary button remains: Start Assessment.
- Payment options appear after click:
  - PayPal
  - Credit Card
  - Payoneer
  - Bank Transfer
- Credit card text is now professional:
  - Secure card payment is processed through an encrypted payment link.
- Referral tracking added:
  - Use links like https://shadowscore.io/?ref=partnername
  - Also supports ?partner=, ?affiliate=, ?utm_source=
  - Referral is stored in localStorage and included in payment requests.
- Partner Tracking Links section added to the homepage.
- Existing OG / WhatsApp preview is preserved.

Important:
- Referral tracking is currently browser-side and suitable for MVP.
- For production, connect referrals and leads to Supabase/Firebase/backend API.
- Payoneer is request-based through WhatsApp until real Payoneer checkout is connected.

Deploy:
npm run build
git add .
git commit -m "ShadowScore V10.2 professional checkout and referrals"
git push origin main

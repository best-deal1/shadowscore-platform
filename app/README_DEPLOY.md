# ShadowScore V7 Marketplace Trust Engine

This update preserves the existing cyber design and adds the functional upgrades discussed today.

Included:
- app/page.tsx
- app/intake/page.tsx
- app/leads/page.tsx
- app/layout.tsx
- app/about/page.tsx
- app/privacy/page.tsx
- app/terms/page.tsx
- app/security/page.tsx
- components/ShadowScoreLayout.tsx
- components/PaymentButtons.tsx
- public/shadowscore-shield-v8.png

Main upgrades:
- Real preliminary intake engine based on marketplace, case type, uploaded file names and missing evidence
- Multi-marketplace requirements for eBay, Amazon, Walmart, Etsy, TikTok Shop and SHEIN
- "Why this score?" breakdown with risk drivers and recommended actions
- No score when no evidence is uploaded
- Leads dashboard at /leads using localStorage
- Tracks whether the user clicked WhatsApp after the scan
- Export leads to CSV
- PayPal and manual credit card payment CTAs
- Marketplace Blind Spot section
- "Seller Performance is not Account Safety" positioning
- Poor Selling Activity explanation
- Safer language: independent assessment, no internal marketplace access claims
- FAQ and legal trust pages kept
- OpenGraph metadata kept in app/layout.tsx

Important:
The /leads page currently stores scans locally in the browser. This is good for MVP testing.
For production, replace localStorage with Supabase/Firebase/Postgres/API storage.

Deploy:
npm run build
git add .
git commit -m "ShadowScore V7 marketplace trust engine"
git push origin main

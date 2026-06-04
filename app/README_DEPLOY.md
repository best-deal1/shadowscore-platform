# ShadowScore V9 Marketplace Trust Engine

This package is a stable V9 upgrade based on the current project.

What changed:
- New cyber mystery shield is added as the main ShadowScore logo.
- Existing WhatsApp / social preview is preserved. Do not replace the current `shadowscore-og.jpg` in production.
- Header logo sizing is reduced to avoid text cropping.
- PayPal and Credit Card CTAs are preserved and made clearer.
- Intake page upgraded into a real preliminary assessment engine.
- Multi-marketplace evidence requirements added:
  - eBay
  - Amazon
  - Walmart
  - Etsy
  - TikTok Shop
  - SHEIN
- Missing files now show real errors.
- Score is calculated from evidence completeness, marketplace, case type and filename-based risk signals.
- Risk findings include severity and recommended action.
- Leads can be saved locally in browser storage.
- Marketplace Blind Spot section added.
- ShadowScore Engine risk factor section added.
- Recovery Assistance Network added carefully, without guarantees.
- FAQ expanded with good feedback, TBA tracking, internal score and recovery disclaimers.

Important:
- Do not delete your existing production `public/shadowscore-og.jpg` if you like the current WhatsApp preview.
- This ZIP intentionally does not include a new OG image that would replace the current preview.
- The engine is preliminary. It reads filenames and evidence completeness, not document contents yet.

Files changed:
- app/page.tsx
- app/intake/page.tsx
- app/layout.tsx
- components/PaymentButtons.tsx
- public/shadowscore-shield-v8.png
- public/shadowscore-super-shield-v2.png
- public/marketplaces-monitor-v8.png

Deploy:
npm run build
git add .
git commit -m "ShadowScore V9 marketplace trust engine"
git push origin main

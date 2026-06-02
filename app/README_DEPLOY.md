# ShadowScore V6 Trust Engine Update

Copy these files into the matching paths in your Next.js project.

Included:
- app/page.tsx
- app/intake/page.tsx
- app/layout.tsx
- app/about/page.tsx
- app/privacy/page.tsx
- app/terms/page.tsx
- app/security/page.tsx
- components/ShadowScoreLayout.tsx
- components/PaymentButtons.tsx
- public/shadowscore-shield-v8.png

Main upgrades:
- Multi-marketplace intake requirements for eBay, Amazon, Walmart, Etsy, TikTok Shop and SHEIN
- Preliminary score engine based on uploaded file names, selected marketplace, case type and missing evidence
- Clear error when no evidence is uploaded
- Evidence completeness checklist
- Safer positioning: Marketplace Trust Intelligence
- Legal / trust pages to help with enterprise filtering and customer confidence
- PayPal and Credit Card placeholder buttons
- Improved OpenGraph metadata

Important:
The intake score is preliminary. It does not read full file contents yet. Full content parsing should be added later through a backend API with PDF/text extraction.

Deploy:
npm run build
git add .
git commit -m "ShadowScore V6 trust engine update"
git push origin main

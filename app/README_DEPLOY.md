# ShadowScore V6 Trust Security Update

Files included:
- app/page.tsx
- app/layout.tsx
- app/intake/page.tsx
- components/PaymentButtons.tsx
- components/ShadowScoreLayout.tsx
- app/about/page.tsx
- app/privacy/page.tsx
- app/terms/page.tsx
- app/security/page.tsx

Main updates:
- Reduced public exposure of detailed risk methodology.
- Replaced overly specific public risk labels with safer category-level wording.
- Kept multi-marketplace intake.
- Kept PayPal, Card, Payoneer and Bank Transfer checkout.
- Added About, Privacy, Terms and Security pages.
- Preserved logo, cyber design, marketplace logos, WhatsApp workflow and OpenGraph metadata.
- Kept the engine useful while making clear it is an independent assessment, not internal marketplace data.

Deploy:
npm run build
npm run lint
git add .
git commit -m "ShadowScore V6 trust and security update"
git push origin main

# ShadowScore v12 Revenue Ready

Included updates:
- Smoother fixed-height hero rotator with fade transition.
- Expanded marketplace list with Other.
- Expanded case type list with Auto detect and Other.
- Mandatory marketplace, case type, store/seller ID and email before running scan.
- Auto-detected issue signals from evidence filenames and selected case type.
- Scan confidence and evidence quality.
- Download Full Report opens checkout modal instead of redirecting to Pricing.
- Save Lead renamed to Save Case Draft with clear local-browser explanation.
- Stronger anti-garbage positioning and evidence validation.
- PayPal business email remains sales@best-deal.org.
- WhatsApp remains centralized: 972557293979.
- Payoneer remains logo plus WhatsApp flow.

Deploy:
npm run build
npm run lint
git add .
git commit -m "Upgrade ShadowScore v12 revenue ready intake"
git push origin main

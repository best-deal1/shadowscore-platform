# ShadowScore V15 - Risk Engine V1

This version adds a reusable risk engine:

`lib/riskEngine.ts`

The engine receives:
- Marketplace
- Case type
- Store / seller / URL
- Email
- Uploaded file names
- Evidence completeness

It returns:
- Overall risk score
- Trust score
- Revenue risk score
- Marketplace health stage
- Revenue impact
- Primary risk domain
- Root-cause hypothesis
- Next likely outcome
- Missing evidence
- Recommended actions

Supported risk domains:
- Marketplace Risk
- Reputation Risk
- Financial Risk
- Payment Risk
- Verification Risk
- Security Risk
- Performance Risk
- Supplier Risk
- Product Policy Risk
- VeRO / IP Risk
- Authenticity Risk
- Community Reporting Risk
- URL Trust Risk
- Enforcement Risk
- Evidence Quality

Important:
- This is an independent risk engine.
- It does not claim access to internal marketplace or payment-provider systems.
- It is based on seller-supplied evidence and visible risk indicators.

Deploy:
npm install
npm run build
npm run lint
git add .
git commit -m "Upgrade ShadowScore V15 risk engine"
git push origin main

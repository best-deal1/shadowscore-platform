# ShadowScore V18.5 - Type Safe Paid Gating Fix

Fixes TypeScript errors in lib/portal.ts by matching the existing ShadowScoreReport type.

## Fixes
- Uses reportId instead of id.
- Uses riskScore/confidenceScore instead of score/confidence.
- Uses topFactors instead of factors.
- Checkout creates a locked payment intent that matches the existing report schema.
- Dashboard counts only paid/unlocked reports in report stats.
- Locked payment intents are displayed separately.

## Test
```bash
npm run build
```

## Push
```bash
git add .
git commit -m "V18.5 type safe paid report gating"
git push origin main
```

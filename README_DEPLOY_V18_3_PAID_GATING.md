# ShadowScore V18.3 - Empty Dashboard + Paid Report Gating

This release combines the V18.2 dashboard fix with the business gating layer.

## Included

- New users no longer see demo risk data.
- Dashboard starts empty until real user activity exists.
- Demo reports and demo entities are disabled.
- Free scan messaging is positioned as a preliminary teaser.
- Full intelligence is positioned as paid-only.
- Payment section explains what is unlocked after payment.

## Business Rule

Free Scan:
- Preliminary risk level only
- No full numerical score
- No full risk factor breakdown
- No action plan
- No evidence checklist
- No report ID
- No saved dashboard report

Paid Report:
- Full ShadowScore
- Confidence Score
- Why This Score
- Risk Factors
- Recommendations
- Evidence Checklist
- Report ID
- Saved Dashboard History

## Push

```bash
git add .
git commit -m "V18.3 empty dashboard and paid report gating"
git push origin main
```

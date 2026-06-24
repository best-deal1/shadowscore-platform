# ShadowScore V18.4 - Perfect Dashboard + Paid Report Gating

## Included

- New users no longer receive demo risk reports.
- New users no longer receive demo watchlist entities.
- Checkout saves a locked payment intent, not a completed full report.
- Locked checkout records do not display as completed paid reports.
- Payment area explains that full intelligence unlocks only after payment.

## Manual Test

1. Clear browser localStorage.
2. Create a new account.
3. Open /dashboard.
4. Confirm no fake risk report appears.
5. Run a free scan.
6. Confirm it is only a preview.
7. Open checkout and accept terms.
8. Confirm dashboard shows locked payment intent, not full report.

## Push

```bash
git add .
git commit -m "V18.4 perfect dashboard and paid report gating"
git push origin main
```

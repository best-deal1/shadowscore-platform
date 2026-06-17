# ShadowScore V17 - Legal Checkout + Social Footer + Example Report

## What changed

- Added mandatory legal acceptance checkbox before any paid checkout action.
- Payment buttons remain disabled until the user confirms the disclaimer.
- Added footer social links: LinkedIn, TikTok, X and YouTube.
- Added `/example-report` page with sample report, report ID, confidence score and "Why This Score?" section.
- Added Example Report link to header and footer navigation.
- Added social URL constants to `lib/config.ts`.

## Files changed

- `components/PaymentButtons.tsx`
- `components/ShadowScoreLayout.tsx`
- `lib/config.ts`
- `app/example-report/page.tsx`
- `README_DEPLOY_V17_LEGAL_SOCIAL.md`

## Before production

1. Replace placeholder social URLs in `lib/config.ts` if needed:
   - `LINKEDIN_URL`
   - `X_URL`
   - `TIKTOK_URL`
   - `YOUTUBE_URL`

2. Verify PayPal business email in `lib/config.ts`:
   - `PAYPAL_BUSINESS_EMAIL`

3. Confirm legal wording with a lawyer before processing real paid transactions.

## Local test

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/example-report
http://localhost:3000/intake
```

Test checkout:

1. Click a paid plan.
2. Confirm that PayPal / Credit Card / Payoneer / Bank Transfer are disabled.
3. Tick the legal checkbox.
4. Confirm payment options unlock.

## Deploy to Vercel

### Option A - Vercel Dashboard

1. Upload or push the updated project to GitHub.
2. Open Vercel.
3. Select the ShadowScore project.
4. Trigger a new deployment.
5. After deploy, hard refresh the site.

### Option B - Git

```bash
git add .
git commit -m "Release ShadowScore V17 legal checkout and social footer"
git push origin main
```

Vercel should deploy automatically.

## Post-deploy check

- `/` loads correctly.
- `/example-report` loads correctly.
- Footer social links appear.
- Checkout legal gate blocks payment until accepted.
- WhatsApp help still opens normally.
- LinkedIn preview still uses the OpenGraph image from `app/layout.tsx`.

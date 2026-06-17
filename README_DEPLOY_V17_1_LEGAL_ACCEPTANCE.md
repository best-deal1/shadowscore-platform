# ShadowScore V17.1 - Legal Acceptance, Terms, Privacy and Payment Gate

This ZIP is based on the latest uploaded ShadowScore V17 package.

## What changed in this version

### 1. Strong legal checkout gate
`components/PaymentButtons.tsx` was upgraded.

Before any payment option can be opened, the user must accept the legal disclaimer.

Payment options remain disabled until the checkbox is selected.

The checkout modal now displays:

- ShadowScore provides risk intelligence, estimates and analytical insights only.
- ShadowScore does not guarantee approval, reinstatement, suspension prevention, payment release, marketplace acceptance, revenue growth, sales performance or business outcomes.
- Risk scores are estimates based on public information, user-provided information, AI analysis and proprietary models.
- Marketplace operators and payment providers make independent decisions ShadowScore cannot control.
- Once a report, scan, review or analysis has been generated or delivered, the service is consumed and non-refundable.
- User agrees to the Terms of Service and Privacy Policy before payment.

### 2. Legal acceptance reference ID
Every checkout session generates a reference ID:

`SS-YYYY-XXXXXXXXX`

The checkout modal displays this ID.

For PayPal, the reference ID is sent through:

- `invoice`
- `custom`

For WhatsApp payment requests, the acceptance details are included in the message:

- Accepted Terms and Privacy Policy: Yes
- Acceptance version
- Accepted timestamp
- Reference ID

### 3. Local acceptance audit record
The browser stores a local acceptance record in localStorage:

`shadowscoreLegalAcceptances`

This includes:

- reportId
- planName
- price
- method
- acceptedAt
- legalVersion
- source

This is a front-end audit trail. For production, connect this to a backend/database later.

### 4. Shared legal config
Added:

`lib/legal.ts`

Includes:

- `LEGAL_ACCEPTANCE_VERSION`
- `legalAcceptanceBullets`
- `generateReportId()`

### 5. Full Terms of Service
Updated:

`app/terms/page.tsx`

Includes:

- Informational Use Only
- No Guarantees
- Risk Scores Are Analytical Opinions
- Independent Third-Party Decisions
- User Evidence And Accuracy
- No Refund After Delivery
- Limitation Of Liability
- Changes To Terms

### 6. Full Privacy Policy
Updated:

`app/privacy/page.tsx`

Includes:

- What We Collect
- How We Use Information
- What Not To Upload
- Data Sharing
- Legal Acceptance Records
- Privacy Requests

### 7. Existing V17 features preserved
This package keeps:

- Social footer
- Example Report page
- Report ID demo
- Why This Score section
- Existing payment options
- Existing intake flow
- Existing risk engine
- Existing pages and routing

## Files changed

- `components/PaymentButtons.tsx`
- `app/terms/page.tsx`
- `app/privacy/page.tsx`
- `lib/legal.ts`
- `README_DEPLOY_V17_1_LEGAL_ACCEPTANCE.md`

## Production push instructions

If the project is connected to GitHub:

```bash
git add .
git commit -m "V17.1 - strengthen legal acceptance, terms and privacy"
git push origin main
```

Then redeploy from Vercel / Replit / hosting provider.

If deploying manually:

```bash
npm install
npm run build
npm run start
```

## Important production note

The current acceptance audit record is front-end/localStorage based.

Before serious paid traffic, the next upgrade should save legal acceptance server-side with:

- user email
- plan
- price
- report ID
- acceptedAt
- legal version
- payment provider
- IP/user-agent where legally appropriate

This will provide stronger evidence for PayPal/Stripe disputes.

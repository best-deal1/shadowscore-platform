# Beta readiness release

## Implemented customer journey

The public purchase promise leads to `/intake`. Intake identifies one Business, preserves the checkout draft through authentication, presents a confirmation summary, and creates one $9.90 Executive Report purchase. Payment return shows separate payment and Investigation states. Active work is available in Investigations. Ready work and its Executive Report are available in Archive. The report supports browser printing and a new Investigation action.

## Legacy routes

`/dashboard` and `/workspace` redirect to `/investigations`. `/reports` redirects to `/archive`. Report detail, payment return, API, and internal operations routes remain in place.

## Payment assumptions

PayPal is the configured processor. The price is USD $9.90 for one Business, one Investigation, and one Executive Report. The application does not add taxes or fees. Payment confirmation requires the configured PayPal return or completion endpoint.

## Processing assumptions

The server-side Investigation worker continues after the browser closes. Reports are usually ready within two minutes. Customers check Investigations for status. Email delivery is not promised. A failed report directs the customer to Support with the Investigation reference.

## Sharing limitations

Browser print is the supported sharing method. Report URLs are private and require access to the purchasing Account. Public links, recipient access controls, expiry, revocation, and sharing logs are not available.

## Known beta limitations

Payment depends on the PayPal environment and valid credentials. There is no email-ready notification. Archive contains paid, ready reports. Customer corrections return to the preserved intake draft before payment.

## Test coverage

Production validation covers route contracts, report boundaries, accessibility, translations, lint, and the Next.js production build. The beta journey contract test covers canonical starts, redirects, confirmation, separate states, Archive, repeat purchase, report identity, printing, and recovery copy.

## Manual acceptance steps

1. Open `/` and confirm the one-time purchase promise and Start Investigation action.
2. Open `/intake`, enter a Business URL, and submit. Trigger a validation error and confirm the input remains.
3. Review the Business, scope, Evidence, email, Executive Report, and $9.90 price. Correct the Business once.
4. Continue while signed out. Create or sign in to an Account and confirm return to the preserved intake.
5. Pay with the configured PayPal environment. Record the transaction and Investigation references.
6. Confirm separate payment and Investigation states, delivery range, last update, and safe-close guidance.
7. Close the page, sign in again, and open Investigations. Open the same active Investigation.
8. When ready, open the Executive Report. Confirm Business, reference, issue time, version, scope, conclusion, findings, confidence, limitations, Evidence, and sources.
9. Print the report and confirm its identity header appears. Confirm a copied URL requires Account access.
10. Open Archive, locate the completed Investigation, and reopen its Executive Report.
11. Select Start Investigation and confirm the Business fields are blank.

## Beta Candidate gate

Run one acceptance account through the complete journey before every release candidate. Create the account, purchase an Investigation, wait for the Executive Report, sign out, sign in again, and confirm that the same report remains in the Workspace. Then update the profile name, archive the Investigation, restore it, archive it again, and delete it with the destructive-action confirmation.

| Priority | Release requirement | Status |
| --- | --- | --- |
| P0 | Purchase, verified payment, processing, report entitlement, sign-out, and return access complete without data loss. | Requires configured staging payment credentials. |
| P0 | Archive, restore, and confirmed deletion preserve tenant authorization and return clear success or recovery feedback. | Automated contract covered. Manual staging run required. |
| P1 | Profile name changes remain visible across the public header and Workspace shell. | Manual staging run required. |
| P1 | The journey passes keyboard use, mobile reflow, and 200 percent zoom. | Manual device review required. |
| P2 | Add email-ready notifications and richer report sharing after beta evidence confirms demand. | Deferred until after beta. |

## Rollback considerations

Revert the release commit to restore legacy navigation. Data migrations are not included. Existing intake, payment intent, Investigation, and report records remain compatible.

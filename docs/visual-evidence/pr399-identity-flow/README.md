# Personal identity intake verification

Verified on 31 October 2026 in the authenticated Vercel preview.

- Before screenshot: application commit `700e05e2c36409a1852556af1e8f56d27e1fda4b`.
- After screenshots: application commit `99aefa7b5d9850522d336fcb5fcdf6fbb992e5cb`.
- Preview: https://shadowscore-platform-git-codex-replace-stall-7e13e6-shadowscore.vercel.app/intake
- Desktop viewport: 1363 by 936 CSS pixels. The document had no horizontal overflow.

## Observed behavior

1. Hebrew and English relation-word requests separated the example person, organization, role, and requested contact correctly.
2. The General identity override remained selected after editing a phone request into an email request. Selecting General with the keyboard and moving focus with Tab worked.
3. Personal mode showed a prepared identity request and collection-after-payment terms, with no completed Business Quick Check claim.
4. Changing to a free-mail target in Website mode cleared the prior review and purchase section. The new review used the new target and personal scope.
5. Entering purchase review moved the accessible journey indicator to Review and payment.
6. A live, free Quick Check of `example.com` completed and displayed limited evidence coverage, unresolved business identity, and a preliminary Verify Before Paying result. No paid investigation was started.
7. No application-origin warnings or errors appeared in the reviewed flow. Browser-extension and Vercel/Google sign-in logs were outside the application check.

The screenshots use fictional identity text. Identity review stopped before saving an intake or starting a payment.

## Evidence

- [Before desktop review](before-desktop.jpg): the personal route incorrectly claimed a completed business Quick Check.
- [After desktop review](after-desktop.jpg): the personal route shows a prepared identity request and correct purchase terms.
- [Review viewport](review-viewport.jpg): visible request scope and the collection-after-payment explanation.

## Isolated desktop and mobile browser verification

Verified on 1 November 2026 with Chromium against a production build of exact application commit `701c5f418d3553b58dd386aa63c4ab33e1a33961`.

- [Successful GitHub Actions run](https://github.com/best-deal1/shadowscore-platform/actions/runs/41275951686) ran the full `npm test`, `npm run build` with production validation gates, and `npm run test:intake-browser`.
- [Browser artifact](https://github.com/best-deal1/shadowscore-platform/actions/runs/41275951686/artifacts/13070709643) contains all six original screenshots, structured results, and server logs. The retained copies below remain available after the temporary Actions artifact expires.
- [Structured results](browser-results.json) record the exact source SHA, viewport bounds, and checks for each case.

| Chromium viewport | Input mode | Result |
| --- | --- | --- |
| 1363 by 936 | Pointer | Passed |
| 390 by 844 | Emulated touch | Passed |
| 320 by 800 | Emulated touch | Passed |

The first mobile screenshots, from commit `9a6723b3366fa94aa8936ba9b55de1efc2a59f00`, exposed clipped content inside the main container even though document width matched the viewport. The fix gives the layout an explicit shrinkable column, allows the header to wrap, and adjusts narrow-screen heading and form spacing. The browser assertions now check the main container's scroll width and scroll offset as well as viewport bounds for headings, fieldsets, inputs, selects, textareas, and buttons.

Each viewport passed these browser checks:

1. English and Hebrew relation-word requests produce the expected person, organization, role, and requested result.
2. An explicit General identity override survives later request edits.
3. Personal review uses prepared-request language, canonical scope, and collection-after-payment terms.
4. Headings and controls remain within the viewport, with no internal horizontal overflow or displaced main content.
5. Pointer or emulated-touch actions can select the mode, edit the request, open review, save, and continue.
6. Saving website target A and switching to free-mail target B creates a new intake and sends B's new intake identifier to checkout.
7. A delayed preview response for A cannot restore A after B has reached review.
8. No unexpected external requests or application console errors occur.

### Mobile evidence

- [Before at 320 pixels](before-mobile-320.jpg): internally clipped content that the original document-width check missed.
- [After at 320 pixels](after-mobile-320.jpg): the full personal request and purchase review fit the viewport.
- [After at 390 pixels](after-mobile-390.jpg): personal interpretation, manual override, and review.
- [Changed target at 320 pixels](changed-target-mobile-320.jpg): the new free-mail subject and canonical personal scope.

The automated browser uses a fictional signed-in session and isolated local service fixtures for authentication, previews, intake persistence, checkout, and report navigation. External traffic is blocked. The public personal-identity UI flag is enabled only in the test build; no production readiness or server feature flags were changed. No real investigation, payment, or personal-data discovery occurs in this test.

The 320-pixel case verifies narrow-width reflow. Physical-phone browsers, Safari, operating-system text scaling, and pinch zoom were not tested. The earlier authenticated Vercel check remains the evidence for the live free Quick Check. These results do not certify the live paid report journey.

## Remaining acceptance

A fresh complete Codex review of the exact current remote HEAD remains blocked by the account's code-review usage limit. All 26 existing review threads were resolved when checked on 1 November 2026. The evidence update adds documentation and screenshot files only; the tested application source remains `701c5f418d3553b58dd386aa63c4ab33e1a33961`. No merge is authorized by these test results.

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

## Remaining verification

Responsive mobile rendering, touch interaction, and browser zoom/reflow could not be measured through the available cloud-browser controls. They remain open. A fresh complete Codex review of the current remote HEAD remains blocked by the account's code-review usage limit. This evidence does not certify the live paid report journey or authorize a merge.

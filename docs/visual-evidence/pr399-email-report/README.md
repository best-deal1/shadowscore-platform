# Email-only personal report verification

Application source: `fa232d3a53d4b08463842340b7337e54274ebca8`.

[GitHub Actions run 41294621810](https://github.com/best-deal1/shadowscore-platform/actions/runs/41294621810) verifies the production pipeline and report component. The retained screenshots and [structured browser results](browser-results.json) belong to this application source. A later evidence-only commit does not change the tested application.

## Findings and corrections

- A failed follow-up search discarded observations returned by earlier searches. Email discovery now stops expansion, retains admitted observations, and records partial coverage, completed searches, attempted searches, and the failure reason.
- Customer presentation removed the internal trace used by the report's search counter. A customer-safe execution summary now survives trace removal. Legacy reports without recorded execution facts show unknown counts.
- The personal report omitted source excerpts and discovery paths. It now leads with the strongest public candidate and preserves the observed text, source URLs, matching basis, and ordered path. Source-family counts remain separate from page counts.
- A normal sentence-ending period prevented exact email recognition. Exact-token parsing accepts punctuation and rejects longer mailbox/domain tokens, suffixes, and concatenated addresses.
- Explicitly observed dotted social handles were rejected as domains. They can now be followed as bounded discovery leads. Unlabelled domains and alias similarity do not become identity evidence.
- The provider copied a derived email display name from the orchestration layer into submitted name matching. It now uses explicit structured names, usernames, and phones only. Email-only investigations cannot manufacture name conflicts from the email address.
- The report called corroborated search candidates verified and displayed a no-evidence banner above actual public candidates. It now distinguishes public candidates, corroborated candidates, empty discovery, and incomplete coverage. Canonical completion and attribution gates remain unchanged.

## Verification

- Full `npm test` and `npm run build`, including lint and production validation gates: passed.
- Eight report regressions run the real provider, provider manager, resolver, report pipeline, and customer presenter. They cover email-only evidence, missing traces, rate limits, timeouts, an initial provider failure, a dotted-handle continuation, exact email boundaries, and invented-name contradictions.
- Twenty-four canonical routing and completion regressions include actual rendered customer labels for all six completion states.
- Fifteen Chromium report cases cover five scenarios at 1363 by 936, 390 by 844, and 320 by 800 CSS pixels: a public candidate, a multi-hop profile lead, partial coverage, no candidate, and an unavailable provider.
- Browser checks assert viewport and internal content bounds, visible excerpts and paths, correct search counts, touch/pointer anchor navigation, no internal administrator diagnostics, no false verification label, and no invented submitted-name conflict.
- Print-media checks retain the investigated email, source excerpt, and discovery path.
- External requests are blocked and unexpected browser errors fail the checks.

The browser renders the actual `PersonalIdentityReport` component with the production CSS and the customer-shaped output from `buildReadyReport` and `presentReportForEndUser`. It does not bypass the protected application route or authenticate a real account. The baseline is captured component markup from `989ad0ec17cff2b869b2cd0491fca935c8c85b66`, generated with the same fictional subject.

## Evidence

- [Before desktop](before-desktop.jpg).
- [Before at 320 pixels](before-mobile-320.jpg).
- [After desktop](after-desktop.jpg).
- [After at 320 pixels](after-mobile-320.jpg).
- [Multi-hop discovery at 390 pixels](multi-hop-mobile-390.jpg).
- [Retained evidence after a provider limit at 320 pixels](partial-mobile-320.jpg).

## Practical limits and remaining acceptance

The search transport is an isolated fixture with fictional public results. The tests prove that available observations survive the pipeline and reach the customer. They do not measure live identity-discovery recall, establish the identity of any real person, or certify a live paid report. The fixture payment object causes no transaction.

The live implementation still uses the configured Brave Search source with the existing limits of 12 searches, three hops, 12 identifiers, and an eight-second provider deadline. These budgets, production readiness flags, payment behavior, and corporate-domain-first routing were not expanded. A search excerpt is a discovery observation, rather than a directly fetched page or verified identity fact.

A live report benchmark remains open because a ShadowScore account session was not established through the secure sign-in request. Vercel access is separate. No real personal investigation or payment was submitted. Physical phones, Safari, and a new PDF export were not tested.

All 26 earlier inline review threads were resolved when checked on 1 November 2026. Fresh complete Codex review of the exact current remote HEAD remains blocked by the account's review usage limit. These checks do not authorize a merge.

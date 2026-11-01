# Source-reported identity profiles

Screenshot and browser source: `3c8cb202d74687199e0991cbbf944608c27b439b`.

[Actions run 41340073171](https://github.com/best-deal1/shadowscore-platform/actions/runs/41340073171) passed the full test suite, production build, desktop/mobile intake acceptance, and 24 identity-report browser cases. The retained [structured results](browser-results.json) identify this exact source. The Vercel preview also passed.

Artifact: `13096798122`. ZIP SHA-256: `51514f02bb2dbd72a29c85b52c97227ef21ca8c1898bb7ba293f64af20d3dfbd`.

The following commit preserves this evidence, clears the legacy attribution-confidence field for ambiguous candidates, and preserves exact-email classification for non-social public sources. Its renderer and browser fixtures are unchanged. Regressions check both attribution-confidence fields, the unresolved outcome, and exact-email classification.

## Customer-visible result

An email-only investigation can now show a source-reported name, role, and organization with a citation and source-family count for each detail. These are public search observations. The report explains that a source may describe past employment.

An observed organization narrows the discovered person's follow-up query within the existing search budget. In the isolated professional fixture, the exact-email result supplies Dana Example and Example Labs. The bounded query `"Dana Example" "Example Labs"` returns another source family that independently repeats the email. The report identifies a corroborated public lead, while the reported employment details remain source observations.

If sources report different names, the finding stays unresolved and shows each name with its own citation. A multi-person excerpt without a clear subject association suppresses profile details. Neither case can produce a corroborated identity or a contradiction with an unsubmitted name. The finding, candidate, and contradiction review use consistent language.

Technical matching scores are inside a native disclosure. The visible report leads with the profile, attribution state, source observations, and discovery path.

## Verification and product review

- Full local and Actions `npm test` and `npm run build`, including lint and production gates, passed for the cited screenshot source.
- Local `npx tsc --noEmit` and `git diff --check` passed.
- Seven source-fact regressions cover explicit email notation, phone/date/identifier separation, source-bound employment, labelled subject blocks, multi-person ambiguity, name variants, and per-fact source-family counting.
- Twelve report regressions execute the actual provider, provider manager, resolver, report pipeline, customer presenter, and component. They include email-only employment discovery, organization-targeted follow-up, different source names, ambiguous subjects, retained partial evidence, empty/unavailable states, exact-email boundaries, and multi-hop handles.
- Twenty-four canonical routing/completion regressions preserve corporate-domain-first routing, readiness guards, explicit failure outcomes, and actual rendered completion states.
- Twenty-four Chromium report cases cover eight scenarios at 1363 by 936, 390 by 844, and 320 by 800 CSS pixels. They check both document overflow and content overflow, source citations, clear attribution states, counters, and absence of unexpected network requests or browser errors.
- Keyboard acceptance focuses the native Matching details summary, presses Enter to open it, checks expanded layout, presses Enter again, and verifies closure at all three widths. Links use descriptive accessible names. Profile fields use semantic description lists. Status remains text-labelled.
- Print-media checks preserve the subject, excerpt, and discovery path. Desktop and mobile screenshots were inspected for hierarchy, wrapping, contradictory copy, and source visibility.

## Before and after

The before images show application source `fa232d3a53d4b08463842340b7337e54274ebca8`, also used by the evidence-only `541daa14` baseline. The same fictional email and public search result are used after the change.

- [Before desktop](../pr399-email-report/after-desktop.jpg).
- [Before at 320 pixels](../pr399-email-report/after-mobile-320.jpg).
- [After desktop](after-desktop.jpg).
- [After at 320 pixels](after-mobile-320.jpg).
- [Corroborated public lead at 390 pixels](corroborated-mobile-390.jpg).
- [Different source names remain unresolved at 320 pixels](different-names-mobile-320.jpg).
- [Ambiguous multi-person excerpt on desktop](ambiguous-desktop.jpg).

## Public-source replay and practical limits

An additional regression replays a short professional speaking-contact excerpt from [Addy Osmani's primary source](https://addyosmani.com/talks/), checked on 1 November 2026. It demonstrates that explicit public `(at)` notation can reach exact-email matching with the normalization method preserved. The production implementation contains no person-specific rule or hardcoded identity.

This is a replay and transport-correctness benchmark. It does not establish live Brave Search recall. Other report scenarios use fictional people, pages, search responses, and payment objects. No real investigation or paid transaction was submitted. Browser tests render the actual report component and production CSS using customer-shaped pipeline output; they do not authenticate an account or bypass a protected route.

The production Brave connection, verified migration and owner-scoped storage, and five readiness flags remain prerequisites for live personal discovery. Limits remain 12 searches, three hops, 12 identifiers, and an eight-second provider deadline. No production activation, billing change, or merge was performed.

Live saved-report acceptance remains open because the secure ShadowScore sign-in request did not establish a session. Physical phones, Safari, and a new PDF export remain outside the verified scope. Fresh complete Codex review is still blocked by the account's code-review usage limit. This evidence does not authorize a merge.

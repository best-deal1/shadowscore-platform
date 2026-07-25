# Homepage sample report quality audit

## Verdict

**Overall result: FAIL. The homepage sample is static demonstration content. It is disconnected from Website Intelligence.** A full website input to rendered report validation was therefore not possible. This audit does not treat the internal module output as the homepage report.

The 20 corpus sites were each evaluated against the actual homepage path. None could produce a site-specific homepage report. The per-site result files preserve that result instead of inventing reports or metrics.

## Canonical homepage report path

The exact user path is:

1. `app/page.tsx` renders `app/components/MarketingHome.tsx`.
2. The homepage links to `/sample-report` and explicitly calls it an illustrative sample.
3. `app/sample-report/page.tsx` declares all visible values and prose as constants inside the React component.
4. The route does not accept a website, load a provider, call `investigateWebsite`, import `WebsiteIntelligenceReport`, or validate a report schema.

The separate internal path is `lib/websiteIntelligence/index.ts` → `investigateWebsite()` → registered modules in `lib/websiteIntelligence/modules.ts` → `WebsiteIntelligenceReport`. There is no adapter from that type to the homepage sample and no import relationship between the paths.

**Data classification:** static and mocked for demonstration. It is not real or partially real. The disclosure on both the homepage and sample route is accurate.

## Audited flow

| Stage | Homepage path result | Audit finding |
|---|---|---|
| Website input | Fail | `/sample-report` has no subject or website input. |
| Acquisition | Fail | No acquisition runs. |
| Providers | Fail | No provider is called. |
| Evidence | Fail | No evidence objects, source names, collected values, or evidence identifiers are rendered. |
| Findings | Fail | Three factual statements are hard-coded and have no evidence links. |
| Decision/scoring | Fail | `Medium`, `82%`, and `68%` are constants. No derivation is present. |
| Final report model | Fail | There is no report model or schema behind the route. |
| Homepage rendering | Partial | All static sections render from one component, but data states and site-specific reports do not exist. |

## Metrics

| Metric | Result |
|---|---:|
| Corpus sites audited | 20 |
| Site-specific homepage reports generated | 0 |
| Report generation success rate | 0/20 (0%) |
| Traceable factual claims | 0/3 (0%) |
| Unsupported factual claims | 3 unique claims |
| Contradictions | 0 observed within the static display |
| Schema/contract failures | 20/20 |
| Sites passing the end-to-end audit | 0/20 |

The unsupported-claim count is the count of unique claims in the one canonical static report, not 60 fabricated site claims. Each per-site record repeats the same three failures because the same route would be shown for every corpus entry.

## Evidence, claims, and decision integrity

The report states that a business identity is supported, payment-account ownership is unresolved, and conflicting address and beneficiary verification information exists. The route supplies no subject, evidence, source, provider, collected value, or provenance for those statements. The “source appendix” is only a heading and a description of what a full report would include.

The recommendation, medium risk, 82% confidence, and 68% evidence coverage are visually compatible, so no direct textual contradiction was counted. Their numeric provenance cannot be reviewed. Missing provider data cannot affect the display because providers never run. Severity proportionality and score derivation therefore fail validation.

## Hallucination and cross-domain review

The visible factual statements are unsupported demonstration assertions. They are clearly labeled as demonstration data, which reduces the risk of mistaking them for a live result, but the assertions remain untraceable within the report.

All 20 domains map to the identical content and conclusions. This is deterministic static repetition, not evidence that the domains share the same risk. No domain name appears in the report.

## Presentation review

The route contains the four summary values and three named report sections. No internal provider payloads or debug fields are exposed. Responsive Tailwind classes provide a one-column default and a two-column summary at the `sm` breakpoint. The page has no empty, unavailable, error, or partial-data branches to inspect.

Rendered-output reference: `/sample-report`. A browser screenshot was not captured because this environment has no Chromium, Playwright, or Puppeteer installation. Static desktop and mobile breakpoint review was completed from the route classes. This is an environment limitation, not a rendering pass.

## Repeatability

Three source-level evaluations produced the same route hash and visible model. Every field is stable because every field is a constant. No expected live-data variation exists on this route. This proves static repeatability only. It does not validate repeatability of acquisition, providers, decisions, or a final report generator.

A supplemental live run of the separate internal Website Intelligence pipeline returned an internal report object for all 20 sites after manually loading the actual TypeScript compiler output. Each site completed 3 of 11 modules and marked 8 unavailable in this environment. That run is not included in homepage success metrics because the homepage cannot consume those objects. The checked-in live harness itself failed before scanning because it looked for `/tmp/shadowscore-website-intelligence-live/index.js`; compilation produced `/tmp/shadowscore-website-intelligence-live/websiteIntelligence/index.js`.

## Per-site results

| Site | Report Generated | Contract | Evidence | Unsupported Claims | Contradictions | Result |
|---|---|---|---|---:|---:|---|
| google.com | No | Fail | Fail | 3 | 0 | Fail |
| microsoft.com | No | Fail | Fail | 3 | 0 | Fail |
| amazon.com | No | Fail | Fail | 3 | 0 | Fail |
| apple.com | No | Fail | Fail | 3 | 0 | Fail |
| github.com | No | Fail | Fail | 3 | 0 | Fail |
| openai.com | No | Fail | Fail | 3 | 0 | Fail |
| cloudflare.com | No | Fail | Fail | 3 | 0 | Fail |
| stripe.com | No | Fail | Fail | 3 | 0 | Fail |
| paypal.com | No | Fail | Fail | 3 | 0 | Fail |
| shopify.com | No | Fail | Fail | 3 | 0 | Fail |
| wix.com | No | Fail | Fail | 3 | 0 | Fail |
| canva.com | No | Fail | Fail | 3 | 0 | Fail |
| bbc.com | No | Fail | Fail | 3 | 0 | Fail |
| nytimes.com | No | Fail | Fail | 3 | 0 | Fail |
| wikipedia.org | No | Fail | Fail | 3 | 0 | Fail |
| mozilla.org | No | Fail | Fail | 3 | 0 | Fail |
| leumi.co.il | No | Fail | Fail | 3 | 0 | Fail |
| hapoalim.co.il | No | Fail | Fail | 3 | 0 | Fail |
| ksp.co.il | No | Fail | Fail | 3 | 0 | Fail |
| keter.com | No | Fail | Fail | 3 | 0 | Fail |

Structured details are in `results/WI-01.json` through `results/WI-20.json`. The aggregate machine-readable record is `report-audit-matrix.json`.

## Critical defects

1. The homepage sample is disconnected from the Website Intelligence pipeline.
2. No canonical final report model or schema is consumed by the sample renderer.
3. All displayed scores and coverage values are hard-coded and have no derivation.
4. Three factual findings have no evidence, provider, collected value, or provenance links.
5. The live validation harness requires the wrong compiler output path and cannot execute as checked in.
6. Empty, unavailable, partial-data, and error states do not exist in the sample renderer.

## Pilot readiness recommendation

**Not ready for a homepage-report pilot.** Keep the current page classified only as an illustrative mock. Before a report pilot, define a canonical final report schema, adapt Website Intelligence output into it, make the homepage sample consume that same model, render evidence provenance and unavailable states, and validate score derivation. Those are production changes and are intentionally outside this audit-only change.

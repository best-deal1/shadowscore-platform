# Website Intelligence validation

This package defines the evidence needed to assess Website Intelligence for a limited pilot. It validates the existing module contract. It does not change scoring, authentication, or product business logic.

## Contents

- `corpus.json` is the fixed set of 20 public sites. The mix covers several sectors and regions.
- `providers.json` inventories all 11 modules and records external dependencies. Reputation and screenshot capture are declared placeholders.
- `matrix.json` records deterministic checks, live acceptance targets, baseline metrics, and the pilot recommendation.
- `tests/website-intelligence-validation.test.mjs` validates these artifacts without network access.
- `scripts/validate-website-intelligence-live.mjs` measures the existing implementation against the matrix.

## Baseline and recommendation

The baseline is an acceptance target, not a claim about current provider performance. A live run must cover all 20 sites. Pilot readiness requires a 95% site completion rate, 90% required-module completion, 90% evidence coverage, site-level p95 duration of 15 seconds or less, and no more than 5% unexpected module failures.

The current recommendation is conditional. Proceed with a limited pilot only after the flagged live run meets every target. Reputation and screenshot results remain explicit evidence gaps until approved providers are configured. Validation output must not be treated as a numeric business risk score.

## Commands

Run the deterministic suite:

```sh
npm run test:website-intelligence-validation
```

The live runner performs external DNS, TLS, RDAP, and HTTPS requests. It skips unless the environment flag is explicitly enabled:

```sh
WEBSITE_INTELLIGENCE_LIVE=1 npm run validate:website-intelligence-live
```

Live results vary with provider availability and site behavior. The command exits with a failure code when an acceptance target is missed.

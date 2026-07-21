# ShadowScore production architecture

ShadowScore is Business Trust Infrastructure. Product surfaces consume reusable Trust Intelligence capabilities rather than becoming separate sources of business logic. The capability catalog in `lib/platform` defines the shared platform vocabulary and is available as metadata at `GET /api/platform/capabilities`.

## Engine responsibilities

ShadowScore keeps collection, interpretation, and presentation separate. Engines exchange typed report data and do not render product UI.

| Layer | Responsibility | Output boundary |
| --- | --- | --- |
| Provider Engine | Executes configured provider checks with time limits and records provider status. | Provider results with evidence, duration, errors, and provenance. |
| Evidence Pipeline | Normalizes provider output into evidence records and coverage summaries. | Evidence items and evidence summary. |
| Correlation | Identifies evidence relationships across providers. | Correlation findings. |
| Business Intelligence | Produces evidence-backed cross-provider business findings. | Business findings with provider references. |
| Identity Resolution | Resolves canonical business identity from available evidence. | Canonical identity and provenance. |
| Knowledge Graph | Stores entities and relationships for the investigation. | Knowledge graph snapshot. |
| Decision Engine | Evaluates evidence for a decision and its confidence. | Decision output and decision integrity data. |
| Executive Decision Brief | Converts approved report data into a business-readable narrative. | Canonical narrative sections and source provenance. |

For the complete capability catalog, integration boundary, and rule for adding a new engine, see [Trust Intelligence Platform](./TRUST_INTELLIGENCE_PLATFORM.md).

`lib/reportPipeline.ts` is the server-side coordinator. It is responsible for ordering engine calls, payment gating, report versioning, and assembling `ShadowScoreReport`. Individual engines remain responsible only for their own domain output.

## Report flow and contract

1. An intake creates an investigation request and a payment intent.
2. After payment is confirmed, the server-only report pipeline executes the provider plan.
3. Provider output is normalized into evidence, then passed to correlation, identity, knowledge graph, business intelligence, and decision layers.
4. The narrative builder creates the canonical sections in this order: Executive Summary, What We Found, What Increases Confidence, What Requires Verification, Recommended Next Steps, Cost of Uncertainty, Investigation Story, and Evidence Used.
5. The ready report stores the engine version, provider versions, narrative, business findings, and source provenance.
6. Browser views receive `presentReportForEndUser` output. Internal reasoning, execution records, provider results, technical details, and knowledge graph records are removed before presentation.

`npm run validate:report-contract` protects the canonical section IDs, titles, and ordering. Report views should derive report content from this contract rather than create parallel report schemas.

## Investigation lifecycle

An investigation progresses through `preview`, `payment_pending`, `generating`, `ready`, or `failed`. Payment progresses independently through `payment_pending`, `processing`, `paid`, `failed`, or `refunded`.

The report pipeline only accepts a paid intent. A ready report is written after provider execution and all report engines finish. A failed or unavailable browser load is a presentation concern and must not alter the investigation state.

## Browser and public boundaries

Client Components may use browser-safe session helpers and serialized workspace data. They must not import report orchestration, executable providers, the server payment-generation helper, or server admin aggregation.

Server-only execution begins at Route Handlers such as `app/api/workspace/mark-paid/route.ts`. The handler invokes `lib/workspace.server.ts`, which invokes `lib/reportPipeline.ts`. Provider execution remains on that path. `npm run validate:public-browser-boundary` checks Client Components for prohibited server-only imports.

## Production validation

`npm run build` runs the production validation gate before the Next.js production build. The gate validates the report contract, reasoning boundary, business intelligence, decision integrity, public browser boundary, accessibility guardrails, and lint rules.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Human Writing Pass

Treat UI and marketing copy as product work. Before submitting a change, review new or edited copy for clarity, brevity, and a factual tone.

- Do not use em dashes.
- Prefer short sentences, periods, commas, and colons.
- State what the product does. Do not frame copy around what it does not do.
- Avoid hype, generic AI language, and unnecessary adjectives.

## Product Polish Pass

Before writing code for a screen, audit the entire screen, not only the requested component. Review its visual hierarchy, navigation, responsive behavior, accessibility, copy, and loading, empty, error, and success states. Check for duplicate navigation, broken flows, inaccessible interactions, and unprofessional behavior.

When the audit finds an inconsistency, dated pattern, or unprofessional interaction that belongs to the same screen and task scope, fix it in the same pull request. Do not stop at functional acceptance criteria. Keep unrelated changes in separate work.

Use [`BR_03_PRODUCT_EXCELLENCE.md`](BR_03_PRODUCT_EXCELLENCE.md) as the screen-level product quality checklist and [`BR_04_COMMERCIAL_SAAS_EXCELLENCE.md`](BR_04_COMMERCIAL_SAAS_EXCELLENCE.md) as the product-wide consistency standard. Every product pull request must satisfy both standards before merge.

## Execution Standard

BR-01 through BR-04 are the permanent engineering and product standards. Planning is complete. Do not create additional planning documents, excellence standards, roadmaps, or product audits unless a human explicitly requests one.

- Work from the approved roadmap. Use one GitHub issue and one deployable feature per pull request.
- Review affected screens before implementation. Improve issues within the task scope and avoid unrelated refactoring.
- Include before and after screenshots, mobile screenshots, an accessibility review, and a UX explanation with every UI pull request.
- Include tests, error handling, and appropriate logging with every backend pull request.
- Make every feature production-ready before merge.

## Customer-Visible Delivery

Every implementation pull request must improve the perceived quality of the product.

Before opening a pull request, ask: "If this were the only change released today, would users immediately notice that the product became better?"

If the answer is no, the work is probably too small or lacks visible customer value. Group related improvements so every release produces a visible improvement. Do not ship technical work with no visible customer value unless it blocks future product work.

Every sprint must end with a customer-visible improvement. After each sprint, answer:

1. If ShadowScore were presented to an investor tomorrow, what would still fall below a commercial standard?
2. What three issues most reduce a new user's trust?
3. Which single improvement would create the largest increase in perceived quality?

Record shipped customer-facing changes in [`RELEASE_NOTES.md`](RELEASE_NOTES.md).

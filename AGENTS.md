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

Before writing code for a screen, audit that screen's user experience. Review its visual hierarchy, navigation, responsive behavior, accessibility, copy, and loading, empty, error, and success states.

When the audit finds an inconsistency, dated pattern, or unprofessional interaction that belongs to the same screen and task scope, fix it in the same pull request. Do not stop at functional acceptance criteria. Keep unrelated changes in separate work.

Use [`BR_03_PRODUCT_EXCELLENCE.md`](BR_03_PRODUCT_EXCELLENCE.md) as the product quality checklist and definition of done.

# BR-04: Commercial SaaS Excellence Standard

## Status and Scope

This document is the permanent product-wide quality standard for ShadowScore. It is a review standard, not a feature backlog. It defines how customer-facing experiences should work together as one mature commercial SaaS product.

BR-03 governs the quality of an affected screen. BR-04 governs consistency across the complete product. Every future product pull request must satisfy both standards before merge.

Apply a requirement when the relevant capability exists or is introduced by the change. Do not add inactive controls, unsupported claims, or speculative features to satisfy this document. When a pull request exposes a product-wide inconsistency outside its scope, record focused follow-up work.

## Product Principles

1. **Clarity:** A user can identify the page purpose, current state, and next action without instruction.
2. **Continuity:** Marketing promises, product behavior, reports, billing, and legal terms describe the same commercial contract.
3. **Trust:** Claims are specific, evidence is traceable, prices are complete, and consequential actions are explicit.
4. **Control:** Users can navigate back, recover from errors, review commitments, and understand the effects of an action.
5. **Consistency:** Shared patterns use the same language, appearance, behavior, and accessibility contract.
6. **Restraint:** Every visible element supports a user task. Decoration never competes with evidence or action.
7. **Inclusion:** Core journeys work across supported viewports, input methods, assistive technology, and locales.
8. **Performance:** Useful content appears quickly, interaction remains responsive, and progress is honest.

## Page Standards

The following contracts cover every current customer-facing area named by this standard. A secondary CTA is optional when a second action would weaken the page. In that case, provide a clear navigation path instead.

### Marketing

#### Home

- **Purpose:** Explain the decision problem ShadowScore solves and direct qualified visitors to an investigation or product evaluation.
- **Primary CTA:** Start the supported investigation or signup journey.
- **Secondary CTA:** View a sample report or methodology.
- **User expectations:** A concise value proposition, intended audience, workflow summary, credible proof, clear price path, and direct access to security and legal information.
- **UX principles:** Lead with the user outcome. Reveal detail progressively. Keep repeated CTAs consistent.
- **Visual hierarchy:** Value proposition first, primary action second, product proof third, then process, trust, and final action.
- **Information hierarchy:** Outcome, input requirements, deliverable, method, trust, commercial terms.
- **Accessibility expectations:** Semantic landmarks and headings, descriptive links, accessible media, and no essential information conveyed only through animation.
- **Performance expectations:** Prioritize the hero and primary action. Reserve media dimensions. Defer nonessential assets.
- **Mobile expectations:** Preserve the complete proposition and CTA above early scroll. Stack proof without horizontal overflow.

#### Pricing

- **Purpose:** Let a buyer understand cost, included value, limits, billing cadence, and the next commercial step.
- **Primary CTA:** Select the relevant plan or purchase path.
- **Secondary CTA:** Contact sales when a supported custom path exists.
- **User expectations:** Current currency, taxes or tax handling, renewal terms, plan limits, entitlements, refund or cancellation path, and feature comparison.
- **UX principles:** Make total commitment clear before action. Use comparable plan structures and plain commercial language.
- **Visual hierarchy:** Recommended option may be emphasized without obscuring alternatives. Price, cadence, and CTA stay adjacent.
- **Information hierarchy:** Price and cadence, included usage, material limits, comparison, FAQ, legal terms.
- **Accessibility expectations:** Plan distinctions exist in text, comparison tables have headers, and pricing controls have accessible names and states.
- **Performance expectations:** Pricing and entitlements render without layout shift. Checkout dependencies load after intent where practical.
- **Mobile expectations:** Plans remain comparable in a linear flow. Sticky actions must not cover terms or browser controls.

#### Methodology

- **Purpose:** Explain how ShadowScore collects, evaluates, and presents information.
- **Primary CTA:** Start an investigation after understanding the method.
- **Secondary CTA:** View a sample report.
- **User expectations:** Scope, sources, scoring logic at an appropriate level, limitations, update policy, and interpretation guidance.
- **UX principles:** Separate fact, inference, and limitation. Use examples to clarify the process without making unsupported claims.
- **Visual hierarchy:** Method overview, process stages, evidence model, scoring interpretation, limitations.
- **Information hierarchy:** Inputs, processing, outputs, confidence, limitations, governance.
- **Accessibility expectations:** Diagrams have equivalent text. Ordered processes use semantic lists. Definitions are available near specialist terms.
- **Performance expectations:** Core methodology is server-rendered or otherwise available without heavy interactive diagrams.
- **Mobile expectations:** Process diagrams reflow into ordered steps and retain reading order.

#### Sample Report

- **Purpose:** Demonstrate the structure, evidence quality, and decision usefulness of the deliverable.
- **Primary CTA:** Start an investigation.
- **Secondary CTA:** Review methodology or download an accessible sample when available.
- **User expectations:** Clearly labeled sample data, representative sections, legible evidence, and no implication that sample findings are live.
- **UX principles:** Match the real report structure. Protect sample access from creating false expectations about paid access.
- **Visual hierarchy:** Executive summary, score and status, major findings, evidence, methodology notes.
- **Information hierarchy:** Decision first, supporting findings second, detailed evidence and limitations last.
- **Accessibility expectations:** Report structure uses headings and landmarks. Charts include text equivalents. The downloadable sample is accessible.
- **Performance expectations:** Load a useful report shell and summary before large charts or document previews.
- **Mobile expectations:** Tables and evidence adapt without hiding material fields. Download and navigation actions remain reachable.

#### Security

- **Purpose:** Explain the controls, responsibilities, and practices that protect customer and investigation data.
- **Primary CTA:** Contact the appropriate security or sales channel.
- **Secondary CTA:** Review privacy terms.
- **User expectations:** Accurate control descriptions, data handling, access model, retention, incident contact, and dated attestations where applicable.
- **UX principles:** Prefer verifiable facts over broad assurances. Distinguish current controls from planned work.
- **Visual hierarchy:** Security posture, data lifecycle, access controls, operational practices, contact.
- **Information hierarchy:** Customer concern, implemented control, scope, evidence or policy link, escalation route.
- **Accessibility expectations:** Control summaries use meaningful headings and links. Documents expose format and file size.
- **Performance expectations:** Essential security content does not depend on third-party badges or scripts.
- **Mobile expectations:** Control grids become readable sections and policy links remain easy to activate.

#### FAQ

- **Purpose:** Resolve common evaluation, usage, billing, data, and support questions.
- **Primary CTA:** Continue to the most relevant product or purchase step.
- **Secondary CTA:** Contact support or sales.
- **User expectations:** Concise current answers, logical categories, searchable content when volume warrants it, and links to authoritative detail.
- **UX principles:** Use the customer's wording. Avoid duplicating inconsistent policy text.
- **Visual hierarchy:** Common questions first, then grouped detail, then unresolved-question contact.
- **Information hierarchy:** Question, direct answer, conditions, authoritative link.
- **Accessibility expectations:** Disclosure controls expose expanded state, work by keyboard, and retain logical heading order.
- **Performance expectations:** Answers are available in the initial document and remain discoverable without client scripting.
- **Mobile expectations:** Touch targets and disclosure spacing prevent accidental activation.

#### About

- **Purpose:** Establish the company identity, mission, expertise, and accountability behind ShadowScore.
- **Primary CTA:** Evaluate the product through the supported journey.
- **Secondary CTA:** Contact the company.
- **User expectations:** Factual company information, operating context, responsible contacts, and substantiated credentials.
- **UX principles:** Use concrete facts. Keep the product and company narratives aligned.
- **Visual hierarchy:** Mission, company facts, approach, accountability, next step.
- **Information hierarchy:** Identity, purpose, relevant experience, operating principles, contact.
- **Accessibility expectations:** Team imagery has useful alternatives where informative. Contact links identify their destination.
- **Performance expectations:** Optimize portraits and brand media. Avoid blocking third-party embeds.
- **Mobile expectations:** Identity and contact details remain prominent without oversized media.

#### Contact

- **Purpose:** Route a visitor to sales, support, security, privacy, or general help with clear response expectations.
- **Primary CTA:** Submit a correctly routed inquiry.
- **Secondary CTA:** Use a direct published channel when appropriate.
- **User expectations:** Required fields, data-use notice, expected response window, alternate channels, validation, and confirmation.
- **UX principles:** Ask only for information needed to respond. Preserve entries after recoverable errors.
- **Visual hierarchy:** Contact options, form, privacy context, response expectation.
- **Information hierarchy:** Route, identity and reply details, message, consent or notice, confirmation.
- **Accessibility expectations:** Persistent labels, explicit errors, error summary, programmatic required states, and announced success.
- **Performance expectations:** The form remains usable during slow submission and prevents accidental duplicate requests.
- **Mobile expectations:** Use appropriate input types, avoid forced zoom, and keep the submit action visible after validation.

#### Privacy

- **Purpose:** Describe personal data collection, use, sharing, retention, rights, and contact routes.
- **Primary CTA:** Exercise a privacy right or contact the privacy owner.
- **Secondary CTA:** Review related terms or security information.
- **User expectations:** Effective date, jurisdiction-aware rights, controller identity, lawful or stated purposes, subprocessors where required, and change policy.
- **UX principles:** Match implemented data behavior. Use navigable plain language without weakening legal accuracy.
- **Visual hierarchy:** Summary and effective date, data practices, user rights, contact, change history.
- **Information hierarchy:** Scope, data categories, purposes, sharing, retention, rights, contact.
- **Accessibility expectations:** A table of contents supports long-form navigation. Headings and lists reflect the legal structure.
- **Performance expectations:** Legal text remains readable without scripts and stable at a durable URL.
- **Mobile expectations:** Long text uses comfortable measure, spacing, and anchored navigation.

#### Terms

- **Purpose:** Define the enforceable service, account, payment, acceptable-use, liability, and termination contract.
- **Primary CTA:** Contact the designated legal channel for questions.
- **Secondary CTA:** Review privacy or pricing terms.
- **User expectations:** Effective date, contracting entity, eligibility, service scope, billing, cancellation, restrictions, dispute terms, and changes.
- **UX principles:** Keep commercial claims consistent with pricing, checkout, and product behavior. Present acceptance at the relevant commitment point.
- **Visual hierarchy:** Summary and effective date, core obligations, commercial provisions, risk allocation, contact.
- **Information hierarchy:** Agreement scope, accounts, service, payment, use, termination, legal provisions.
- **Accessibility expectations:** The document uses semantic structure, descriptive cross-links, and keyboard-reachable anchored navigation.
- **Performance expectations:** Terms are available without scripts and use a durable, indexable URL where legally appropriate.
- **Mobile expectations:** Legal text and tables reflow without horizontal page scrolling.

### Authentication

#### Login

- **Purpose:** Return an authenticated user to the correct protected destination.
- **Primary CTA:** Log in.
- **Secondary CTA:** Recover a password or create an account.
- **User expectations:** Clear requirements, password visibility, actionable errors, secure session handling, and restoration of the intended destination.
- **UX principles:** Minimize distraction. Do not reveal whether an account exists beyond the approved security policy.
- **Visual hierarchy:** Page identity, credentials, primary action, recovery and signup paths, support.
- **Information hierarchy:** Instruction, fields, validation, action, alternate path.
- **Accessibility expectations:** Autofill tokens, persistent labels, announced errors, logical focus, and keyboard submission.
- **Performance expectations:** The form becomes interactive quickly and exposes stable feedback during authentication.
- **Mobile expectations:** Inputs use suitable keyboards and the action remains available when the virtual keyboard opens.

#### Signup

- **Purpose:** Create an account with informed consent and a clear path to first value.
- **Primary CTA:** Create the account.
- **Secondary CTA:** Log in to an existing account.
- **User expectations:** Account requirements, password guidance, terms and privacy links, verification expectations, and transparent plan implications.
- **UX principles:** Collect the minimum required data. Validate near the field while preserving a complete error summary on submission.
- **Visual hierarchy:** Benefit and step context, required fields, consent, primary action, existing-account path.
- **Information hierarchy:** Identity, credentials, terms, action, verification next step.
- **Accessibility expectations:** Password criteria are available before entry and update accessibly. Consent controls have complete labels.
- **Performance expectations:** Prevent duplicate accounts from repeated submission and preserve valid input after recoverable errors.
- **Mobile expectations:** Single-column entry, correct input types, and no content hidden behind the keyboard.

#### Forgot Password

- **Purpose:** Start secure account recovery without exposing account status.
- **Primary CTA:** Send recovery instructions.
- **Secondary CTA:** Return to login.
- **User expectations:** The identifier required, neutral confirmation, delivery guidance, expiration context, and a retry or support path.
- **UX principles:** Keep the flow short and resist account enumeration. Rate-limit with clear, nontechnical feedback.
- **Visual hierarchy:** Recovery instruction, identifier field, action, return path.
- **Information hierarchy:** Required input, privacy-safe response, next step, support.
- **Accessibility expectations:** Status is announced without moving focus unexpectedly. Errors identify a correction.
- **Performance expectations:** Immediate pending feedback and protection against duplicate submissions.
- **Mobile expectations:** Email keyboard and autofill work correctly. Confirmation remains readable at narrow widths.

#### Email Verification

- **Purpose:** Confirm account ownership and move the user into the intended product journey.
- **Primary CTA:** Continue after successful verification or resend when verification is pending.
- **Secondary CTA:** Change account, return to login, or contact support.
- **User expectations:** Current verification state, destination address in privacy-conscious form, link expiry, resend timing, and recovery from invalid links.
- **UX principles:** Distinguish pending, success, expired, and failure states. Avoid trapping verified users on the page.
- **Visual hierarchy:** Status, required action, delivery or expiry detail, alternate path.
- **Information hierarchy:** State, consequence, next action, troubleshooting.
- **Accessibility expectations:** State changes use live status semantics and do not rely on color or icon alone.
- **Performance expectations:** Verification resolution is prompt, idempotent, and protected from repeated actions.
- **Mobile expectations:** Status and next action appear without unnecessary scrolling.

### Application

#### Workspace

- **Purpose:** Orient a user to current work, recent activity, and the next valuable action.
- **Primary CTA:** Start an investigation.
- **Secondary CTA:** Resume recent work or view all investigations.
- **User expectations:** Correct workspace context, useful status summary, recent items, alerts, permissions, and clear onboarding when empty.
- **UX principles:** Prioritize decisions and work requiring attention. Keep summary metrics traceable to their source lists.
- **Visual hierarchy:** Workspace identity, primary action, attention items, activity and summaries.
- **Information hierarchy:** Context, next work, status, recent activity, supporting metrics.
- **Accessibility expectations:** Dashboard regions have headings, data visualizations have text equivalents, and cards follow a logical focus order.
- **Performance expectations:** Render the useful shell and priority data first. Load independent panels without blocking the page.
- **Mobile expectations:** Put actions and attention items before metrics. Avoid compressed desktop grids.

#### Investigations

- **Purpose:** Find, compare, create, and manage investigation records.
- **Primary CTA:** Start an investigation.
- **Secondary CTA:** Open, resume, or manage a selected investigation.
- **User expectations:** Search, relevant filters and sorting, durable status, ownership, timestamps, pagination or an appropriate alternative, and supported bulk actions.
- **UX principles:** Preserve list state across detail navigation. Make destructive and billable actions explicit.
- **Visual hierarchy:** Title and create action, search and controls, results, selection actions, pagination.
- **Information hierarchy:** Identity, status, subject, owner, recency, available action.
- **Accessibility expectations:** Table semantics, named sort controls, selectable-row labels, keyboard operation, and announced result counts.
- **Performance expectations:** Debounce remote search, cancel stale requests, and avoid rerendering the full list for a local state change.
- **Mobile expectations:** Use a priority-column table or record cards. Keep filtering in a labeled, reversible panel.

#### Executive Reports

- **Purpose:** Find, review, share, and export completed decision reports within access rules.
- **Primary CTA:** Open the selected report.
- **Secondary CTA:** Download, share, or copy a permitted link.
- **User expectations:** Subject, completion date, version, access state, investigation relationship, export state, and clear permission feedback.
- **UX principles:** Treat reports as controlled decision artifacts. Keep on-screen, shared, and exported versions consistent.
- **Visual hierarchy:** Report identity and decision summary, high-risk findings, evidence, actions, supporting detail.
- **Information hierarchy:** Decision, score and confidence, major findings, evidence, limitations, provenance.
- **Accessibility expectations:** Structured headings, accessible charts and tables, meaningful evidence links, and accessible exported documents.
- **Performance expectations:** Summary and navigation load before deep evidence. Large exports run with visible progress and completion feedback.
- **Mobile expectations:** Preserve decision context and evidence traceability. Actions collapse into a clearly labeled menu when needed.

#### Archive

- **Purpose:** Locate retained inactive records and restore or permanently remove them when policy and permission allow.
- **Primary CTA:** Restore a selected record.
- **Secondary CTA:** Permanently delete or return to active records.
- **User expectations:** Archive date, retention impact, record type, search and filters, permission limits, and explicit deletion consequences.
- **UX principles:** Separate reversible restoration from irreversible deletion. Never imply deletion when retention policy prevents it.
- **Visual hierarchy:** Archive context and policy, controls, records, selected action.
- **Information hierarchy:** Record identity, type, archived date, retention state, available action.
- **Accessibility expectations:** Confirmation dialogs name the record and consequence. Focus returns to a logical position after an action.
- **Performance expectations:** Archive queries are paginated and actions update only affected records.
- **Mobile expectations:** Record identity and retention state remain visible before actions.

#### Monitoring

- **Purpose:** Configure and review ongoing changes, alerts, and monitored subjects.
- **Primary CTA:** Add or configure a monitored subject.
- **Secondary CTA:** Review an alert or adjust notification settings.
- **User expectations:** Coverage, frequency, last check, next check, alert severity, delivery status, entitlement limits, and pause or removal controls.
- **UX principles:** Distinguish absence of change from failed monitoring. Explain the operational and billing effect of configuration changes.
- **Visual hierarchy:** Active coverage and alerts, monitored subjects, history, settings.
- **Information hierarchy:** Attention state, subject, observed change, time, coverage health, action.
- **Accessibility expectations:** Severity has text, timelines have semantic structure, and new alerts are announced without stealing focus.
- **Performance expectations:** Incremental refresh does not reset user context. Polling pauses appropriately when the page is inactive.
- **Mobile expectations:** Alerts lead, configuration follows, and dense history becomes a readable sequence.

#### Admin

- **Purpose:** Manage workspace members, roles, policy, operational access, and auditable administrative actions.
- **Primary CTA:** Perform the highest-priority permitted administrative task.
- **Secondary CTA:** Review audit history or configuration.
- **User expectations:** Current scope, role and permission effects, member state, auditability, safeguards, and clear denial when unauthorized.
- **UX principles:** Use least privilege. Require review for consequential changes and show who or what will be affected.
- **Visual hierarchy:** Workspace and admin context, attention items, management sections, audit history.
- **Information hierarchy:** Scope, target, current state, proposed change, consequence, actor and time.
- **Accessibility expectations:** Permission matrices have complete headers. Dialogs manage focus and describe consequences.
- **Performance expectations:** Authorization is enforced server-side and reflected without exposing restricted data in the initial payload.
- **Mobile expectations:** Complex matrices become task-based editors rather than compressed tables.

#### Billing

- **Purpose:** Explain the current commercial relationship and support permitted plan, payment, invoice, and cancellation tasks.
- **Primary CTA:** Resolve the most relevant billing action, such as updating payment or selecting a plan.
- **Secondary CTA:** View invoices, usage, or contact billing support.
- **User expectations:** Plan, status, price, currency, cadence, renewal date, usage, limits, payment method, invoices, taxes, and cancellation effect.
- **UX principles:** Show the full monetary and service consequence before confirmation. Reconcile provider state with product entitlements.
- **Visual hierarchy:** Subscription state and next charge, issues requiring attention, usage, payment, invoices, plan actions.
- **Information hierarchy:** Status, amount and timing, entitlement, usage, payment instrument, history, controls.
- **Accessibility expectations:** Currency and dates are unambiguous, status does not rely on color, and hosted payment transitions are announced.
- **Performance expectations:** Display a stable last-known state while refreshing. Make pending provider operations explicit and idempotent.
- **Mobile expectations:** Amount, renewal, and payment issues lead. Invoice tables become labeled records.

#### Settings

- **Purpose:** Configure workspace-level product behavior in clearly separated categories.
- **Primary CTA:** Save the current settings section.
- **Secondary CTA:** Cancel or restore the current saved values.
- **User expectations:** Scope, defaults, validation, saved state, permission requirements, and the effect of each change.
- **UX principles:** Group by user goal. Save explicitly when changes are consequential and warn before discarding edits.
- **Visual hierarchy:** Settings navigation, section purpose, controls, save state and action.
- **Information hierarchy:** Scope, setting, current value, effect, validation, save result.
- **Accessibility expectations:** Controls use native semantics, descriptions are associated, and save errors link to affected fields.
- **Performance expectations:** Load and save sections independently. Prevent duplicate writes and show conflict handling when data changed elsewhere.
- **Mobile expectations:** Settings navigation becomes a clear list and editors remain single-purpose.

#### Profile

- **Purpose:** Manage the signed-in user's identity, preferences, security, and session-related controls.
- **Primary CTA:** Save profile changes.
- **Secondary CTA:** Manage password, sessions, or account actions.
- **User expectations:** Account email and verification state, editable identity, preferences, security controls, and consequences of account deletion where supported.
- **UX principles:** Separate personal settings from workspace settings. Reauthenticate for sensitive changes.
- **Visual hierarchy:** Identity, preferences, security, sessions, consequential account actions.
- **Information hierarchy:** Account identity, editable fields, verification, security state, irreversible controls.
- **Accessibility expectations:** Avatar controls have text alternatives, validation is explicit, and sensitive-action dialogs manage focus.
- **Performance expectations:** Update only changed data, optimize media before upload, and provide visible save progress.
- **Mobile expectations:** Keep each section compact and ensure security actions have enough context before confirmation.

## Global Consistency Requirements

### Foundations

- **Typography:** Use a documented type scale, limited weights, readable line length, and tabular numerals for comparable metrics. Heading levels reflect document structure, not visual preference.
- **Spacing:** Use the shared spacing scale. Component interior spacing, section rhythm, and control density remain predictable across viewports.
- **Grid:** Use a consistent content width, gutters, columns, and breakpoints. Alignment communicates relationships. Pages reflow rather than shrink.
- **Color:** Use semantic design tokens. Meaning survives color-vision differences, high contrast preferences, and monochrome output.
- **Icons:** Use one icon system with consistent size and stroke. Pair unfamiliar or consequential icons with text. Decorative icons stay hidden from assistive technology.
- **Motion and page transitions:** Preserve orientation with brief, purposeful transitions. Respect reduced-motion preferences. Never delay navigation or hide loading behind decorative animation.

### Components

- **Cards:** Use cards only for grouped, independently actionable content. Keep padding, borders, radius, headings, and action placement consistent. Avoid nested card decoration.
- **Tables:** Provide semantic headers, alignment by data type, useful column priority, sort state, responsive behavior, selection labels, and pagination context.
- **Forms:** Use persistent labels, guidance before errors, appropriate input types and autofill, clear required states, inline validation, error summaries, preserved values, and explicit submission status.
- **Buttons:** One primary action per decision area. Labels describe the outcome. Style communicates hierarchy, not novelty. Disabled controls explain prerequisites when the reason is not evident.
- **Dialogs:** Reserve dialogs for focused decisions. Name the consequence, trap focus while open, close predictably, support Escape when safe, and return focus to the trigger.
- **Notifications:** Use inline feedback near the affected content when correction is required. Use transient notices for completed background context. Announce status accessibly and let users dismiss persistent notices.
- **Badges:** Represent a defined state with stable wording, shape, and color. Provide text and a documented mapping for status, severity, plan, and access states.
- **Breadcrumbs:** Use breadcrumbs for meaningful hierarchy, not browser history. Identify the current page and preserve accessible names.

### Navigation and Product Shell

- **Navigation:** Use one primary destination model across the application. Current location, workspace context, permissions, and responsive behavior are clear. Every destination and logo has a valid route.
- **Footer:** Marketing pages share a complete footer with current product, company, support, security, legal, and copyright links. Application footers remain minimal when the shell supplies these routes elsewhere.
- **User menu:** Show account identity, workspace context where relevant, profile and settings paths, and a clear logout action. Keyboard behavior and focus order match an accessible menu pattern.
- **Page titles:** Every page has one visible primary heading and an accurate document title. Titles follow a consistent product naming pattern.

### State and Feedback

- **Loading states:** Show the structure being loaded, preserve stable layout, and use progress indicators with accessible names. Do not present an empty state before loading resolves.
- **Error states:** State what failed, the effect, and a useful recovery action. Preserve user work. Log diagnostic detail without exposing it to customers.
- **Success states:** Confirm the completed action and resulting state. Provide the next logical step. Avoid success notices for passive navigation.
- **Empty states:** Distinguish first use, no search results, filtered-out results, lack of permission, and removed data. Offer a relevant action or explanation.
- **Offline and delayed states:** Where network interruption affects a core task, identify unsaved work, retry safely, and reconcile when connectivity returns.

### Data Interaction

- **Search:** Label the searchable scope, submit or debounce predictably, expose result count, preserve the query, support clearing, and distinguish no data from no match.
- **Filtering:** Use product vocabulary, show active filters, make removal easy, preserve meaningful filters during navigation, and provide a single clear reset.
- **Sorting:** State the active field and direction, use stable defaults, support keyboard operation, and keep sorting consistent across pagination.
- **Pagination:** Communicate item range, total when available, current page, and disabled boundaries. Preserve filters and sorting.
- **Bulk actions:** Require explicit selection, state the selected count and scope, show only supported actions, confirm consequential changes, and report partial failure per record.

### Accessibility

- **Keyboard accessibility:** Every interactive task works without a pointer. Focus is visible, ordered, never trapped outside an active modal, and restored after overlays or route changes.
- **Screen reader support:** Use semantic HTML first. Landmarks, names, descriptions, headings, table relationships, live status, and validation expose the same meaning as the visual interface.
- **Color contrast:** Text, icons, focus indicators, component boundaries, charts, and states meet WCAG 2.2 AA contrast requirements. Large text exceptions are not a substitute for readable default text.
- **Touch and pointer use:** Targets are large and separated enough for reliable activation. Hover never carries unique information.
- **Zoom and reflow:** Core content and actions remain available at 200 percent zoom and at 320 CSS pixels without two-dimensional page scrolling, except for content that inherently requires it.

### Responsive and Platform Readiness

- **Mobile:** Design task priority for narrow screens. Do not merely stack every desktop element. Respect safe areas, virtual keyboards, orientation changes, and touch ergonomics.
- **Dark mode readiness:** All visual decisions use semantic tokens and assets that can support another color scheme. A dark-mode control appears only when every core surface, chart, export, and state is complete.
- **Localization readiness:** Keep interface copy out of layout assumptions. Support text expansion, locale-aware dates, numbers, currencies, pluralization, and right-to-left direction where selected locales require it.
- **Browser behavior:** Core journeys work in supported browsers with predictable native input, autofill, history, refresh, deep-link, download, and print behavior.

### Discoverability and Measurement

- **SEO readiness:** Public pages have unique titles and descriptions, canonical URLs, intentional indexing, semantic headings, useful link text, share metadata, structured data where accurate, and sitemap coverage.
- **Private-page indexing:** Authentication, account, workspace, checkout, and report access routes use the appropriate indexing restrictions and never expose protected content in metadata.
- **Analytics readiness:** Define the question before the event. Use stable event names and documented properties, measure meaningful funnel and error outcomes, avoid duplicate events, honor consent, and exclude secrets and unnecessary personal data.
- **Experimentation:** Experiments have an owner, hypothesis, success and guardrail metrics, audience, end condition, and accessible experience in every variant.

### Performance Budget

For production builds measured at the 75th percentile on representative mobile traffic:

- Largest Contentful Paint is at most 2.5 seconds.
- Interaction to Next Paint is at most 200 milliseconds.
- Cumulative Layout Shift is at most 0.1.
- Initial route JavaScript and third-party scripts have an explicit budget reviewed in the pull request when they increase.
- Images, fonts, charts, and document previews are sized, compressed, cached, and loaded according to priority.
- Public pages render essential content without waiting for nonessential client JavaScript.
- Application routes show useful structure promptly and stream or defer independent data where supported.

A pull request that exceeds a budget must document the measurement, customer impact, cause, approved exception, and concrete recovery work.

### Trust and Commercial Integrity

- **Trust indicators:** Place specific proof near the decision it supports. Security, methodology, customer, and compliance claims identify their scope and remain current. Do not use unsupported badges, fabricated activity, or vague superlatives.
- **Professional writing:** Use concise, factual language and stable product vocabulary. Prefer direct sentences. Avoid hype, generic AI language, unexplained jargon, and em dashes.
- **Legal consistency:** Product behavior, consent, retention, access, security, privacy, and terms match their published policies. Legal documents share the correct entity, jurisdiction, dates, definitions, and contact details.
- **Commercial consistency:** Marketing, pricing, checkout, invoices, entitlements, account status, cancellation, and support describe the same plan names, currency, cadence, limits, taxes, and renewal contract.
- **Payment consistency:** Before commitment, show the item or plan, amount, currency, cadence, applicable tax handling, renewal, and cancellation terms. After payment, show a durable status, receipt path, entitlement result, and safe recovery from pending, failed, duplicate, or refunded states.
- **Brand consistency:** Use approved name, logo, voice, color, type, imagery, and asset treatment. Brand expression never obscures task hierarchy, evidence, or accessibility.
- **Executive Report consistency:** On-screen, shared, printed, and downloaded reports use the same decision identity, score, finding language, evidence provenance, timestamps, limitations, access rules, and version.
- **Workspace consistency:** Workspace name, membership, role, plan, permissions, data boundaries, and active context agree across navigation, lists, reports, administration, billing, notifications, and audit history.

## Review Method

Before implementation, review the affected journey against this document and BR-03:

1. Identify the page purpose, primary action, user state, workspace context, and commercial state.
2. Trace the entry point, happy path, alternate path, failure recovery, and next destination.
3. Compare the page with shared foundations, components, vocabulary, and neighboring journeys.
4. Check loading, empty, error, success, permission, offline, and responsive states that apply.
5. Check keyboard, screen reader, contrast, zoom, motion, localization, metadata, analytics, and performance implications.
6. Verify claims, entitlements, payments, legal terms, report identity, and workspace boundaries against authoritative product behavior.
7. Keep same-screen and same-journey corrections in scope. Record unrelated product-wide findings as focused follow-up work.

## Definition of Done

Every product-facing pull request must satisfy all of the following before merge:

- The pull request identifies the affected BR-03 screen audit and applicable BR-04 page and global standards.
- The page purpose and CTA hierarchy are clear and match the user's current state and permissions.
- Marketing, application, billing, legal, workspace, and report language remain consistent wherever the change touches them.
- Shared components and tokens are reused or deliberately extended with documented rationale.
- Loading, empty, error, success, permission, and consequential-action states are complete where applicable.
- Keyboard, screen reader, focus, contrast, zoom, reduced motion, and touch behavior have no known regression.
- Mobile and desktop layouts preserve task priority and complete core workflows.
- Public metadata and indexing behavior are correct. Private content remains protected from indexing and metadata exposure.
- Analytics changes are documented, privacy-conscious, and verified without duplicate events.
- Performance is measured for perceptible or material changes and remains within budget, or an approved exception is documented.
- Claims, plan details, prices, payment states, legal references, report identity, and workspace context are verified against authoritative behavior.
- Relevant automated tests, a production build, and browser console checks pass.
- Perceptible visual changes include before and after evidence at affected breakpoints.
- Any environment limitation names the missing check, reason, risk, owner, and remaining verification step.

## Permanent Standard

BR-03 and BR-04 are merge requirements for every future product pull request. BR-03 ensures that each affected screen is complete. BR-04 ensures that every screen belongs to the same coherent, accessible, trustworthy, and commercially consistent ShadowScore product.

# ShadowScore end-to-end customer journey review

## Purpose

This review follows a first-time paying customer from the public website through delivery, sharing, retrieval, and repeat purchase of an Executive Report. It evaluates the current experience against the frozen product model:

> **Business Investigation → Evidence → Executive Report → Archive**

This is an experience audit. It does not authorize a redesign, a vocabulary change, or a new feature. Recommendations clarify, connect, or simplify capabilities already represented in the product.

## Review method and assumptions

The review examined the current public navigation, homepage, pricing, intake, authentication, payment, processing, investigation, and report surfaces. It also compared those surfaces with the product freeze decision.

The customer in this review:

- Has not used ShadowScore before.
- Needs to investigate one business for a real decision.
- Pays for one Executive Report.
- May need to explain the purchase and findings to a colleague.
- Expects to return later and investigate another business.

The current implementation exposes more than one path through the product. Intake produces a preview and leads into report checkout. The Investigations area also creates and advances investigation records. Reports are listed through the dashboard route, while investigation details present an analyst workspace. This review treats those parallel paths as customer friction, not as separate products.

## Executive assessment

The customer can discover an investigation, enter a business, see a preview, pay through PayPal, wait for report generation, and open a report. The core transaction is visible. The experience is not yet reliably self-serve because the stages do not read as one continuous purchase journey.

The largest risks are:

1. **The purchase promise changes across surfaces.** The website refers to investigations and reports, while pricing and checkout use Free Preview, Full Investigation Report, and full report. A customer may not know whether these are stages of one product or different products.
2. **There are parallel records for the same job.** Intake, Investigations, Reports, dashboard, and investigation details do not establish one obvious customer home.
3. **Intake asks the customer to choose an operating mode before the scope is clear.** Website Business, Marketplace Seller, and Evidence Review can feel like separate products. Requirements, filename-derived warnings, provider detail, and technical output add cognitive load.
4. **Progress does not set a dependable service expectation.** Processing names stages and refreshes status, but it does not explain the expected duration, whether the customer can leave, how delivery will occur, or what happens if input is needed.
5. **The final handoff is incomplete.** The report can be opened, but the reviewed flow does not make sharing, export, report identity, issue date, scope, and return navigation consistently obvious.
6. **Repeat use is hard to predict.** Reports currently resolve to the dashboard and there is no clearly presented Archive. The report flow points back to the intake result rather than to the investigation record or customer history.

### Overall emotional arc

| Moment | Intended emotion | Likely current emotion | Main cause |
| --- | --- | --- | --- |
| First visit | Interested and oriented | Interested, then overloaded | The homepage demonstrates many capabilities and product areas before making the purchase path concrete. |
| Before starting | Confident about fit | Curious but uncertain | Scope, deliverable, timing, data needs, and price are not summarized together. |
| During intake | Guided and in control | Responsible for choosing the right technical path | Modes, evidence rules, preview logic, and provider output compete with the basic business-information task. |
| After submission | Reassured | Unsure whether the paid Investigation has started | Preview, saved lead, investigation, payment, and report states overlap. |
| During payment | Certain about the transaction | Mostly confident, with naming and continuity concerns | Price and PayPal are clear, but product naming and route context change. |
| While waiting | Informed and free to leave | Attentive and hesitant to leave | Stages are visible, but timing, notification, and recovery expectations are missing. |
| At delivery | Ready to decide | Impressed by detail, but unsure what is final | Investigation workspace and Executive Report boundaries are unclear. |
| Sharing | Confident and accountable | Forced to improvise | The flow lacks a clear sharing handoff and recipient context. |
| Returning | Efficient | Searching | Investigations, Reports, dashboard, and intake compete as return destinations. |
| Buying again | Familiar and fast | Repeating discovery work | The next purchase action is not consistently placed after delivery or in history. |

## Journey review

### 1. Landing on the website

**Customer goal:** Decide within a few moments whether ShadowScore is relevant to a business decision and whether it is credible enough to explore.

**Customer emotion:** Cautious curiosity. The customer is scanning for relevance, proof, and commercial legitimacy.

**What the customer expects**

- A plain statement of the problem ShadowScore solves.
- The type of business that can be investigated.
- A visible primary action and a low-risk way to inspect the output.
- Immediate trust signals such as methodology, security, sample output, price, and company contact information.

**Information missing**

- A compact statement of what the customer submits, what ShadowScore does, what the customer receives, and how long it normally takes.
- A clear distinction between the example intelligence shown on the homepage and evidence that will be available for the customer's business.
- A concise fit statement that tells the customer which decisions and business types the current Investigation supports.

**What creates uncertainty**

- The homepage presents Investigations, Monitoring, Reports, Alerts, Workspace, API, Collaboration, and Trust controls. This makes the initial purchase look like one part of a broader platform that the customer may need to understand first.
- Start investigation, Book demo, and View report compete at the final call to action. The customer may infer that assisted onboarding is expected.
- The public header points to Sample report while other links point to Example report. This weakens confidence that the sample is the purchased deliverable.

**What creates trust**

- Methodology, Security, Pricing, and a sample report are available from the public navigation.
- The homepage demonstrates evidence relationships, confidence, and audit context instead of presenting only a score.
- Legal and contact destinations are available.

**What increases confidence**

- Keep one visible Start Investigation action paired with one Sample Executive Report link.
- Put the one-time price, expected input, typical delivery expectation, and output in the same decision block.
- Label all illustrative data as an example and connect it directly to the Sample Executive Report.

**What feels unnecessary**

- Future platform areas and coming-soon resources in the primary conversion journey.
- Multiple demonstrations of intelligence concepts before the customer has understood the transaction.

**What should be simplified**

- Lead with one purchase path: investigate one Business and receive one Executive Report.
- Reduce competing calls to action near the first and final conversion points.

**Recommended improvements**

- Add a short purchase summary beside the primary action: required input, one-time price, output, and delivery expectation.
- Point every sample-report link to the same canonical sample.
- Move future or operational platform capabilities out of the first-time purchase narrative.

### 2. Understanding what ShadowScore does

**Customer goal:** Form an accurate mental model before sharing information or paying.

**Customer emotion:** Analytical. The customer is comparing the promise with an internal risk, procurement, or marketplace decision.

**What the customer expects**

- A simple sequence from business input to evidence review to Executive Report.
- A clear description of coverage, limitations, sources, and the role of automated and human analysis.
- An example that resembles the report they can buy.

**Information missing**

- One authoritative definition of an Investigation on the purchase path.
- A clear boundary between the free preview and the paid Executive Report.
- A consolidated description of report contents, source coverage, freshness, confidence, and appropriate use.
- A statement of what happens when a business cannot be identified or evidence is insufficient.

**What creates uncertainty**

- Product language changes among Investigation, Free Preview, Full Investigation Report, report, scan, assessment, intelligence, and case.
- Pricing includes future subscription plans and monitoring. A first-time buyer may delay a one-time purchase while comparing plans that are not currently part of the transaction.
- The homepage describes a connected platform while the immediate offer is a one-time report.

**What creates trust**

- The method emphasizes sourced evidence, confidence, contradictions, and reviewable records.
- The sample output can show the level of detail and decision context.
- The one-time purchase model is stated at checkout.

**What increases confidence**

- Use the frozen four-stage model as the explanatory spine on Product, Pricing, Sample Executive Report, and intake.
- Explain that the preview helps confirm the Business and initial coverage, while the Executive Report is the purchased deliverable.
- State how incomplete or conflicting evidence is represented in the report.

**What feels unnecessary**

- Roadmap plans during the decision to buy today's product.
- Internal concepts such as providers, entity resolution, runtime, and analyst case boundaries unless they directly explain evidence quality.

**What should be simplified**

- Present one deliverable, one current price, one purchase condition, and one canonical sample.
- Replace feature inventories with a short explanation of the customer decision each report supports.

**Recommended improvements**

- Add a consistent “What you receive” summary at Product, Pricing, intake, and checkout.
- Keep detailed methodology available as supporting proof, not as a prerequisite to starting.

### 3. Starting an Investigation

**Customer goal:** Begin the correct process without wondering whether an account, payment, or evidence upload is required first.

**Customer emotion:** Motivated but risk-sensitive. Starting is the first commitment.

**What the customer expects**

- One Start Investigation action with a predictable destination.
- A short explanation of the steps and time required.
- Clear indication of when account creation and payment occur.
- Confidence that work will be saved.

**Information missing**

- An upfront step count and completion estimate.
- A clear account policy: browse first, sign in first, or create an account when saving.
- A statement of whether starting is free and the exact point at which payment is requested.
- An explanation of how an intake submission becomes an Investigation record.

**What creates uncertainty**

- The homepage can prefill a target into intake, while the Investigations page also contains its own one-field creation form.
- The customer can encounter both a preview workflow and a status workflow with different states.
- Checkout restoration relies on a saved draft after authentication, which may feel like a detour if the transition is not explicitly explained.

**What creates trust**

- Target prefill preserves context from the homepage.
- The customer can begin with a free preview before making a one-time purchase.
- Authentication return paths attempt to return the customer to the interrupted task.

**What increases confidence**

- Confirm that starting is free, name the paid moment, and show the next three steps before the first field.
- Use one entry route for all Start Investigation actions.
- After creation, show an Investigation reference, saved status, Business name, and next action in one confirmation.

**What feels unnecessary**

- A second investigation-creation pattern inside the customer history area.
- Asking the customer to understand preview, saved, payment pending, generating, and ready before the record exists.

**What should be simplified**

- Make intake the single creation path and Investigations the place to resume it.
- Ask only for the minimum information needed to identify the Business and establish contact at the start.

**Recommended improvements**

- Add a clear preflight summary before intake.
- Preserve and display entered data across authentication, validation, and checkout transitions.
- Confirm successful creation in customer language rather than provider or storage language.

### 4. Providing business information

**Customer goal:** Identify the correct Business and provide enough context for a useful Executive Report.

**Customer emotion:** Careful and slightly anxious. The customer knows that incorrect input can affect the result.

**What the customer expects**

- Clear required and optional fields.
- Examples of acceptable URLs, names, identifiers, and files.
- Confirmation that the correct Business has been identified.
- Privacy, file handling, and correction guidance near sensitive inputs.

**Information missing**

- A concise reason for each required field.
- A final review screen that summarizes the Business, scope, evidence, email, price, and terms before purchase.
- A visible method to correct an identity match before the Investigation runs.
- Clear retention and access expectations for uploaded evidence.

**What creates uncertainty**

- The customer must choose Website Business, Marketplace Seller, or Evidence Review before knowing how these choices affect the Executive Report.
- Marketplace, case type, store, website, email, custom platform, and evidence requirements can appear as separate decision systems.
- File relevance warnings are inferred from filenames. A customer may interpret these warnings as a substantive review of the document.
- Technical provider status and unavailable-source output can distract from whether the intake is complete.

**What creates trust**

- Accepted file constraints and blocking issues are surfaced.
- Marketplace-specific evidence guidance can help customers provide useful material.
- Target resolution and provider coverage can support transparency when expressed in customer terms.

**What increases confidence**

- Separate required information from optional evidence.
- Confirm the matched Business with name, website, location, and another identifying attribute before proceeding.
- Explain how customer evidence will be used, who can access it, and how long it is retained.
- Treat filename warnings as organizational hints, not evidence-quality conclusions.

**What feels unnecessary**

- Provider versions, engine versions, policy versions, and operational status in the main intake result.
- Risk conclusions derived from filenames before the customer has received the formal report.
- Requiring the customer to choose an internal analysis path when the product promise is one Investigation.

**What should be simplified**

- Organize intake as: identify the Business, add optional context or evidence, review the scope, continue.
- Keep advanced diagnostics behind supporting detail.

**Recommended improvements**

- Mark every field as required or optional and state why required fields matter.
- Add a review-and-confirm checkpoint using the existing information before the Investigation starts.
- Put privacy and evidence-handling links beside upload and email fields.
- Use a single validation summary with specific corrections and preserve all valid input after an error.

### 5. Waiting while the Investigation runs

**Customer goal:** Know that the purchase and Investigation are progressing without having to supervise the page.

**Customer emotion:** Expectant after payment. Anxiety rises quickly if time and delivery are uncertain.

**What the customer expects**

- Immediate payment confirmation and a receipt or transaction reference.
- A realistic delivery range.
- Permission to close the page, plus a clear explanation of how to return.
- Notification when the Executive Report is ready or when action is required.
- A useful recovery path if processing fails.

**Information missing**

- Expected completion time and the conditions that could extend it.
- Whether generation continues after the page is closed.
- How readiness will be communicated.
- What the customer should do if a stage remains unchanged.
- A support expectation for payment or generation failure.

**What creates uncertainty**

- The processing page polls and offers Refresh status, which can imply that the customer must remain present.
- Identity verified, Evidence analyzed, and Report ready only become complete when the full report is ready. This can make progress appear frozen.
- Payment failure and generation failure appear in the same flow, but their remedies are not equally clear.

**What creates trust**

- Payment status, generation status, and failure states are distinguished.
- The customer sees a staged checklist rather than a generic spinner.
- The PayPal payment provider is named.

**What increases confidence**

- State the delivery range before payment and repeat it after payment.
- Tell the customer that processing continues safely after they leave and where the Investigation can be found.
- Show a stable Investigation reference and Business name throughout processing.
- Give each failure state a next action, support route, and assurance about payment status.

**What feels unnecessary**

- Manual refreshing when automatic status checks are already running.
- Progress stages that do not reflect distinct customer-visible changes.

**What should be simplified**

- Use a small set of honest states: payment confirmed, Investigation in progress, needs input, Executive Report ready, or issue requiring attention.
- Keep one primary next action for every state.

**Recommended improvements**

- Add timing, leave-and-return, and delivery guidance to processing.
- Show payment receipt details separately from investigation progress.
- Provide clear recovery copy for a delayed, failed, or needs-input Investigation.

### 6. Understanding investigation progress

**Customer goal:** Understand what has happened, what is happening now, and whether any action is required.

**Customer emotion:** Reassured when status is concrete. Suspicious when stages are technical or appear artificial.

**What the customer expects**

- One current status with a plain explanation.
- Completed stages, current activity, and the next expected event.
- A visible request if ShadowScore needs more information.
- Consistent progress after leaving and returning.

**Information missing**

- A single mapping between processing status and Investigation status.
- Timestamps for meaningful stage changes.
- A dedicated customer instruction for Needs input.
- The difference between evidence collection, evaluation, review, and final report preparation.

**What creates uncertainty**

- The Investigations list uses preview, saved, payment pending, generating, ready, monitoring, failed, and archived. The frozen model specifies Draft, In progress, Needs input, In review, Report ready, and Archived.
- Processing uses another four-stage checklist.
- Intake exposes provider completion and coverage, which can be mistaken for overall Investigation progress.
- Some list actions advance status manually, which can make status feel like a demonstration rather than a dependable record.

**What creates trust**

- Evidence counts, timestamps, audit metadata, and status explanations can make work reviewable.
- The product distinguishes unavailable sources from completed checks.
- An Investigation reference can provide continuity across support and return visits.

**What increases confidence**

- Present one customer status everywhere and reserve provider state for supporting detail.
- Explain what each status means for delivery and customer action.
- Show “No action needed” or a precise required action.
- Use actual stage changes and timestamps rather than implied percentage completion.

**What feels unnecessary**

- Provider registry detail in the primary customer progress view.
- Internal states such as saved and payment pending after the transaction has been confirmed.

**What should be simplified**

- One status, one explanation, one next action, and one last-updated time.
- Separate purchase state from investigation state.

**Recommended improvements**

- Apply the frozen status mapping across intake, processing, Investigations, and the report header.
- Add a short status glossary where the customer first waits.
- Make Needs input an explicit interruption with requested information and a return path.

### 7. Receiving the Executive Report

**Customer goal:** Confirm that the paid deliverable is complete, understand its conclusion, and use it in a decision.

**Customer emotion:** Relief, followed by scrutiny. Trust now depends on traceability and clarity.

**What the customer expects**

- A clear “Executive Report ready” handoff.
- The correct Business, Investigation reference, issue date, report version, and scope.
- An executive conclusion, key evidence, confidence, limitations, and recommended next steps.
- A clear distinction between fact, inference, unavailable information, and analyst judgment.
- A path back to the Investigation and customer history.

**Information missing**

- A consistent final-deliverable label across checkout, processing, report, and history.
- A prominent report identity block that supports citation and later retrieval.
- A clear explanation of finality, versioning, and whether the report can change.
- A completion handoff that tells the customer what to do next.

**What creates uncertainty**

- The paid flow says full report, Full Investigation Report, and report, while the frozen output is Executive Report.
- Investigation details look like an internal analyst workspace. They include Escalate case, analyst notes, case graph, and locally recorded decision intent. A paying customer may not know whether this is their final report or an operations screen.
- The report route uses a separate visual shell and points Back to result, weakening continuity with the Investigation.

**What creates trust**

- Source provenance, evidence detail, confidence breakdowns, audit metadata, and unavailable-source disclosure support review.
- Payment and readiness must both be confirmed before full access.
- The detailed report format can preserve the reasoning behind a conclusion.

**What increases confidence**

- Lead with a stable report identity and an executive reading order.
- Label sources, observations, inferences, confidence, and limitations consistently.
- Make the Investigation the parent context and the Executive Report its final output.
- Provide a clear support route for factual corrections or questions.

**What feels unnecessary**

- Analyst controls, local-only decision state, provider-backed submission notes, and internal case language in a customer deliverable.
- Operational metadata before the executive conclusion.

**What should be simplified**

- Keep the first screen focused on the decision, strongest evidence, confidence, limitations, and recommended action.
- Move audit and technical material into clearly labeled supporting sections without removing traceability.

**Recommended improvements**

- Standardize the final handoff and title as Executive Report.
- Add report identity, scope, version, issue time, and Investigation reference to the report header.
- Separate customer report reading from analyst work controls.
- End the report with clear actions: share, return to Investigation, view Archive, or start another Investigation.

### 8. Sharing the report with another decision maker

**Customer goal:** Give a colleague enough context to understand and trust the conclusion without conducting a guided tour.

**Customer emotion:** Accountable. The customer is putting their judgment and ShadowScore's credibility in front of another person.

**What the customer expects**

- A clear, safe method to share the Executive Report.
- Predictable recipient access and privacy rules.
- A portable report with stable identity, date, version, scope, sources, and limitations.
- Confidence that the recipient sees the same final content.

**Information missing**

- Whether a copied report URL works for another person.
- Whether the recipient needs an account or paid access.
- Whether download, print, or a portable report is supported.
- Whether sharing is logged, expires, or can be revoked.
- Guidance about sensitive evidence and appropriate distribution.

**What creates uncertainty**

- Report access is tied to the current account, so an ordinary copied URL may send the recipient to authentication without explaining the intended access model.
- There is no clear sharing handoff in the reviewed flow.
- Internal workspace language can make a shared screen look unfinished or intended for analysts.

**What creates trust**

- Stable report identifiers, evidence provenance, audit dates, confidence, and limitations can let a recipient verify what they are reading.
- Clear access control can protect customer and business information.

**What increases confidence**

- State the sharing policy before the customer tries to share.
- Provide a supported share or export action with a short explanation of recipient access.
- Preserve the report identity and evidence context in every supported format.
- Add a visible confidentiality or handling statement where appropriate.

**What feels unnecessary**

- Exposing editable analyst controls to a read-only recipient.
- Requiring the original purchaser to explain product vocabulary or route structure.

**What should be simplified**

- One supported sharing path with explicit access, expiry, and privacy behavior.
- A recipient view focused on the Executive Report, not the surrounding workspace.

**Recommended improvements**

- First, clarify the current access policy and provide reliable print behavior using the existing report.
- Then validate whether customers prefer account-based sharing, a controlled link, or a portable file before choosing a longer-term implementation.

### 9. Returning later to find previous investigations

**Customer goal:** Find the Business, status, and Executive Report without remembering a URL or product structure.

**Customer emotion:** Task-focused. Patience is low because the customer believes the work is already complete.

**What the customer expects**

- Sign in and land on their active Investigations.
- A clearly labeled Archive for completed Investigations and Executive Reports.
- Search or recognition by Business name, date, status, and Investigation reference.
- A direct View Executive Report action.

**Information missing**

- One authoritative authenticated home.
- A clearly presented Archive in the current journey.
- An explanation of retention and long-term report access.
- Consistent distinction between active, completed, and archived work.

**What creates uncertainty**

- Reports resolves to dashboard, while other routes expose Investigations, reports, workspace, account, and dashboard.
- Investigation details link back through Command center and Investigations.
- Report flow points Back to result, which assumes the original intake context still matters.
- Completed work can be interpreted as a report record or an investigation record.

**What creates trust**

- Authenticated access and account-bound report retrieval protect purchased work.
- Business names, references, dates, and status can support recognition if displayed consistently.

**What increases confidence**

- Land returning customers on Investigations and provide Archive as the completed-work destination.
- Show Business, date, status, Investigation reference, and the next action on every record.
- State how long Executive Reports remain available.

**What feels unnecessary**

- Separate Dashboard, Reports, Workspace, Cases, and Investigations destinations for the same retrieval task.
- Asking the customer to return through intake to regain context.

**What should be simplified**

- Active work belongs in Investigations. Completed work belongs in Archive. Each record opens its Investigation and offers View Executive Report when ready.

**Recommended improvements**

- Make sign-in return to Investigations unless a safe, specific return destination exists.
- Present one completed-work list as Archive.
- Ensure every report has a direct, durable path from its Investigation record.

### 10. Purchasing another Investigation

**Customer goal:** Apply a familiar process to another Business with less effort than the first purchase.

**Customer emotion:** Confident if the first report delivered value. Impatient with repeated explanation or setup.

**What the customer expects**

- A visible Start Investigation action after reading a report and when viewing history.
- The same current price and purchase terms.
- Reuse of account and contact information.
- A clear boundary between the previous and new Business.

**Information missing**

- A consistent next-purchase action at report completion, Investigations, Archive, and Account.
- Confirmation that each purchase covers one Business Investigation and one Executive Report.
- A simple summary of what account information is reused and what must be entered again.

**What creates uncertainty**

- Pricing says a report can be purchased for each investigation, while checkout frames the transaction as unlocking a report. The customer may not know whether the repeat purchase begins with a new Investigation or an existing preview.
- Future subscriptions may make the customer wonder whether repeat purchases should wait for a plan.
- Parallel intake and Investigations creation flows produce different expectations.

**What creates trust**

- A one-time price and no-subscription statement make each transaction understandable.
- A visible history of prior purchases can reassure the customer that reports remain accessible.

**What increases confidence**

- Repeat the unit of purchase consistently: one Investigation for one Business, producing one Executive Report.
- Start from a blank Business identity while retaining safe account details.
- Confirm the new Business and price before payment.

**What feels unnecessary**

- Re-explaining the entire platform to a returning purchaser.
- Showing roadmap subscriptions during a repeat one-time purchase.

**What should be simplified**

- One Start Investigation action across authenticated surfaces.
- A shorter returning-customer intake that keeps the same validation and confirmation safeguards.

**Recommended improvements**

- Add Start Investigation as the primary next action after the Executive Report and in Investigations and Archive.
- Show the one-time price and deliverable before the new Investigation is confirmed.
- Keep prior evidence and conclusions attached only to the prior Investigation unless the customer explicitly supplies them again.

## Cross-journey trust builders

The following elements should remain visible and consistent throughout the journey:

- **Continuity:** the same Business name and Investigation reference from confirmation through Archive.
- **Commercial clarity:** exact one-time price, taxes or fees if applicable, payment provider, receipt, refund or failure handling, and the item purchased.
- **Evidence transparency:** sources checked, unavailable sources, observation dates, confidence, contradictions, and limitations.
- **Status honesty:** customer-visible stages that reflect real changes, with a last-updated time and a clear action requirement.
- **Data handling:** privacy, upload handling, access, retention, and sharing rules close to the relevant action.
- **Report identity:** Executive Report title, Business, Investigation reference, issue date, version, and scope.
- **Human recovery:** a support path that carries the Investigation reference and distinguishes payment, identity, evidence, and delivery issues.
- **Vocabulary consistency:** Investigation, Evidence, Executive Report, Archive, Business, Status, and Account used for the same jobs everywhere.

## Prioritized recommended improvements

### Priority 0: required before the first paying customer

1. **Define the transaction in one sentence everywhere.** One Business Investigation produces one Executive Report for the stated one-time price.
2. **Make one path authoritative.** Start Investigation enters intake. Investigations resumes active work. Archive retrieves completed work. The Investigation owns its Executive Report.
3. **Set the delivery expectation before payment.** State timing, notification, whether the customer can leave, and how to return.
4. **Add a pre-purchase confirmation.** Show the matched Business, scope, supplied evidence, customer email, price, and deliverable.
5. **Clarify payment and failure recovery.** Show the receipt reference and provide specific actions for payment failure, delayed processing, generation failure, and requests for more input.
6. **Create a clear final handoff.** Present the output as the Executive Report with stable identity, scope, date, version, confidence, limitations, and a path back to its Investigation.
7. **Establish a supported sharing answer.** Even before a richer sharing workflow exists, clearly state whether recipients need an account and provide dependable print guidance.
8. **Make repeat purchase visible.** Place Start Investigation after report completion and in the authenticated active and completed-work areas.

### Priority 1: remove avoidable friction after the path is coherent

1. Reduce intake to required Business identity and contact information first. Keep optional evidence and diagnostics secondary.
2. Confirm the resolved Business before collection or payment.
3. Map all technical states to the frozen customer status model.
4. Move provider registry, versions, and operational details out of primary progress and intake summaries.
5. Separate the customer Executive Report from analyst controls and local decision tools.
6. Consolidate Sample report and Example report into the canonical Sample Executive Report destination.
7. Remove future plans and unproven platform areas from the current purchase decision path.

## Quick wins

These changes are primarily content, linking, and hierarchy work. They should be validated without changing the product model.

- Add the one-sentence purchase definition to the homepage, pricing, intake, and checkout.
- State “Starting is free” and identify the exact paid step before the first intake field.
- Add a short three-step preview above intake and a completion estimate for the form.
- Mark all intake fields required or optional and explain why required information is needed.
- Add “You can close this page” and return guidance to processing, if the underlying behavior supports it.
- Show the Business name and Investigation reference on payment, processing, report, support, and history surfaces.
- Replace ambiguous Back to result navigation with the appropriate Investigation context.
- Put a clear support action on payment and generation failures.
- Add report issue date, version, scope, and Investigation reference to the final report identity block.
- Add browser print guidance and sharing-policy copy while longer-term sharing behavior is being validated.
- Add Start Investigation after the report and on the completed-work list.
- Point every public sample link to one Sample Executive Report.

## Future improvements

These items should follow observation of beta users. They require evidence about actual behavior or a product decision beyond copy and hierarchy.

- Controlled colleague access with explicit recipient authentication, expiry, revocation, and an access log.
- A portable report format designed for print or file distribution, with the same evidence, version, and limitation context.
- Saved organization profiles and contact defaults for repeat customers.
- Search and filters in Archive once report volume makes recognition insufficient.
- Proactive email or in-product notifications for Report ready and Needs input states.
- Service-level messaging based on measured completion times by Investigation scope.
- Structured factual-correction requests tied to an Investigation and report version.
- Team roles and shared ownership after beta behavior demonstrates a recurring collaboration need.

Monitoring, alerts, watchlists, subscriptions, and broader collaboration should remain outside this customer-journey remediation unless customer research establishes them as necessary for the core purchase and delivery experience.

## First-customer acceptance walkthrough

Before inviting the first paying customer, a person with no product context should complete this walkthrough without assistance:

1. Explain in their own words what one purchase includes, the price, the required input, and the expected output.
2. Start from the homepage and reach the single Investigation intake without choosing among parallel product paths.
3. Identify a Business, understand every required field, correct a validation error, and retain valid input.
4. Confirm the matched Business and Investigation scope before paying.
5. Complete payment and identify the receipt, Investigation reference, current status, expected delivery range, and safe return path.
6. Leave the processing page, sign in again, and find the active Investigation without using browser history.
7. Recognize whether no action is needed or supply requested information when the status is Needs input.
8. Open the ready Executive Report and identify its Business, scope, issue date, version, conclusion, confidence, evidence, and limitations.
9. Explain the supported sharing method and successfully give the report to an authorized colleague.
10. Return later, find the completed Investigation in Archive, open its Executive Report, and start another Investigation.

### Success criteria

The journey is ready for beta when all four outcomes are observed:

- A first-time customer completes an Investigation without assistance.
- The customer accurately explains what they purchased.
- The customer trusts the Executive Report enough to share it with a colleague through the supported method.
- The customer immediately knows how to start another Investigation.

## Beta observation guide

For the first 10 to 20 beta users, record behavior rather than asking only for opinions. Capture:

- The first sentence each person uses to describe ShadowScore.
- The first action selected and every competing action considered.
- Time to start intake, complete intake, reach payment, and find the delivered report.
- Fields that cause hesitation, correction, or abandonment.
- Whether the Business match is checked before purchase.
- Questions asked during payment and waiting.
- Attempts to refresh, leave, contact support, or reopen the Investigation.
- The first section read in the Executive Report and any term that needs explanation.
- The method attempted when sharing.
- The route used to find the report later.
- The location where the customer expects to start the next Investigation.

Prioritize changes by observed abandonment, incorrect purchase understanding, loss of report trust, sharing failure, and inability to repeat the purchase. Treat preferences about visual polish as secondary unless they cause one of those outcomes.

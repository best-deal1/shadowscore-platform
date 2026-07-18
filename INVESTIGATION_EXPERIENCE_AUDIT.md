# Investigation Experience Audit

Scope: Investigation UX only. This audit does not recommend changes to the Decision Engine, Ontology, Knowledge Graph, Providers, or Payments business logic.

## Executive Summary

ShadowScore already has a credible investigation foundation: the homepage supports a high-intent hero target input, `/intake` accepts website/business, marketplace/seller, and evidence-review modes, the free website preview calls production DNS and WHOIS providers, the preview can save an intake, checkout is gated behind legal acceptance, and ready paid reports display decision, identity, timeline, evidence, and technical detail sections.

The current experience still feels closer to a form submission plus result preview than a premium investigation. The biggest UX gap is that provider and evidence activity is mostly hidden until after completion. The product says it is investigating, but the interface does not convincingly show target normalization, provider dispatch, provider status transitions, evidence discovery, confidence build-up, or staged decision reveal.

Recommended north star: turn the journey into a persistent investigation command center with a progressive reveal sequence:

Target
↓
Identity
↓
Evidence
↓
Verification
↓
Decision
↓
Report

This should be implemented as presentation/state mapping over existing outputs, not as business-logic changes.

## Reviewed Journey

### 1. Hero Input

Current state:

- The homepage hero accepts a free-form investigation target and redirects to `/intake?target=...&mode=website` after a short simulated investigation delay.
- While redirecting, it shows a generic list of investigation steps: identifying target, checking infrastructure, resolving identity, collecting evidence, building investigation, and preparing report.
- The hero copy is strong and premium, but the interaction is mostly a delay before navigation.

UX issues:

- The hero does not show target normalization before redirect. Users do not see whether ShadowScore recognized a domain, business, email, phone, or marketplace seller.
- The loading state implies multiple steps completed, but no actual provider activity has happened yet.
- The same broad target placeholder supports many target types, while the redirect always forces `mode=website` unless a marketplace mode is explicitly in the query.

Recommendations:

- Add an immediate target recognition card below the hero input: `Raw target`, `Normalized target`, `Detected target type`, and `Investigation mode`.
- Replace the hero redirect delay with a lightweight `Preparing investigation workspace` state, not a completed-looking investigation timeline.
- Use microcopy such as `Target captured`, `Opening investigation workspace`, and `Provider checks begin on the next screen` to avoid overstating work before `/intake` runs providers.
- Preserve the premium hero, but make the first screen feel like the start of a case file rather than a marketing form.

### 2. Target Normalization

Current state:

- `/intake` reads query parameters and hydrates `websiteTarget` or `store`.
- Target normalization exists in backend investigation lifecycle through target classification, but the intake UX does not expose a normalized target, detected target type, confidence, or classification reasoning.
- The local `normalize()` helper is filename/string normalization, not investigation target normalization.

UX issues:

- Users cannot confirm whether the submitted target was interpreted correctly before provider execution.
- A website, business name, email, phone number, and seller URL can require different evidence expectations, but the UI starts with the same broad path for most hero entries.

Recommendations:

- Add a `Target` stage at the top of `/intake` with:
  - submitted target;
  - normalized target;
  - detected type;
  - confidence indicator;
  - editable correction action.
- Show normalization as the first completed investigation timeline event once the target has been parsed.
- If target type is uncertain, use a premium correction interaction: `We found multiple possible interpretations. Choose how to investigate this target.`
- Do not change the classifier or lifecycle; only surface the existing classified/normalized values where available.

### 3. Investigation Progress and Loading Experience

Current state:

- `/intake` shows an `Investigation timeline` while `freeScanRunning` is true.
- The timeline uses static steps and renders each as checked, even while the scan is still running.
- Homepage uses a similar generic progress list during redirect.
- `/report` shows `Preparing report...` while loading workspace report data.

UX issues:

- The loading states do not distinguish queued, running, completed, failed, unavailable, or not implemented work.
- The current running timeline looks like all steps are already complete.
- There is no visible connection between provider execution and downstream evidence/decision stages.
- Report loading is plain text and does not maintain continuity from the investigation.

Recommendations:

- Replace all generic investigation loading with a single timeline component that supports stage status:
  - `pending` / queued;
  - `running`;
  - `completed`;
  - `failed`;
  - `not_available`;
  - `not_yet_implemented`.
- Use real provider response data where available, and deterministic UI-only placeholder statuses where providers are known but not implemented.
- Report loading should reuse the same design language: `Retrieving report`, `Loading decision`, `Loading evidence`, `Preparing secure report view`.
- Avoid showing checkmarks until a stage actually has result data.

### 4. Provider Execution Visualization

Current state:

- Website investigations define DNS and WHOIS as production providers and SSL, Security Headers, SPF, DMARC, Reputation, and Business Profile as coming soon.
- The UI displays a provider status grid only inside technical details after submission, and uses icons like `⏳`, `✓`, and `!`.
- Provider result status currently maps to `completed`, `failed`, or `skipped` in the provider contract.
- The UI labels non-production providers as `Coming Soon`, but not in a formal provider status taxonomy.

Required provider states:

Every provider execution should clearly show:

- Running
- Completed
- Failed
- Not Available
- Not Yet Implemented

Recommended UI mapping:

| UX Status | Data/UI Source | Display Copy | Visual Treatment |
| --- | --- | --- | --- |
| Running | `freeScanRunning` and provider is production | `Running` | animated pulse, red/amber border, live elapsed time |
| Completed | provider result `status=completed` with useful fields/evidence | `Completed` | green check, evidence count, duration |
| Failed | provider result `status=failed` or request error | `Failed` | red alert, concise error, retry/help copy |
| Not Available | provider result `status=skipped`, empty/unavailable response, provider unavailable | `Not available` | neutral/yellow, explain unavailable source |
| Not Yet Implemented | configured provider has `production=false` | `Not yet implemented` | locked/roadmap badge, no spinner |

Recommendations:

- Move provider visualization out of collapsed technical details and into the active investigation timeline.
- Show providers under the `Evidence` and `Verification` stages as individual rows with status, duration, evidence count, and last message.
- Preserve technical details for raw fields, but let the main experience show provider execution as the product drama.
- Use provider names consistently: `DNS Intelligence`, `WHOIS/RDAP Intelligence`, `SSL Inspection`, `Security Headers`, `Email Authentication`, `Reputation`, `Business Profile`.
- Do not imply that future providers ran. Mark them explicitly as `Not yet implemented`.

### 5. Evidence Discovery

Current state:

- Marketplace/evidence modes analyze uploaded filenames and evidence readiness locally.
- Website mode calls the free provider endpoint and receives providers, insights, timeline, identity profile, business narrative, and decision preview.
- Evidence used is usually hidden in `Technical Details`; the main preview emphasizes identity summary, evidence summary, recommendation, save, and unlock.

UX issues:

- Evidence discovery is not revealed progressively as evidence appears.
- Evidence visibility is mostly narrative; users do not see an evidence ledger during execution.
- Free preview timeline filters to completed items only, which hides unavailable and pending evidence states and can make the investigation feel less transparent.

Recommendations:

- Add an `Evidence discovered` panel that updates as provider results become available.
- Show evidence cards grouped by source:
  - `Public DNS records`;
  - `Registration/WHOIS`;
  - `Business profile`;
  - `Email authentication`;
  - `User-uploaded evidence`;
  - `Marketplace context`.
- Each evidence card should show: source, status, confidence, observed value, and whether full details are locked.
- Use a skeleton-to-card reveal: skeleton while running, compact evidence card on completion, transparent unavailable state when absent.
- Keep raw detail behind a technical drawer, but elevate key evidence into the main investigation journey.

### 6. Decision Reveal

Current state:

- The free preview can show a business narrative, confidence badge, recommendation, and a locked advanced breakdown.
- The full report shows a large decision card with PASS/REVIEW/CONFIRMED RISK styling and confidence score.
- Decision appears after submission in the same result area without a staged reveal.

UX issues:

- The decision reveal is not earned by visible progress through target, identity, evidence, and verification.
- Confidence is shown, but it is not connected to evidence coverage or provider availability.
- Locked advanced breakdown is useful but visually reads like a warning block rather than a premium teaser.

Recommendations:

- Gate the decision reveal behind completion of the prior visible timeline stages.
- Add a `Decision forming` state before reveal, with copy such as `We are separating verified signals from evidence gaps.`
- Animate the decision reveal as a final card flip/spotlight, not as ordinary content appearing below the form.
- Pair the decision with a confidence explanation: `Confidence is based on provider coverage, evidence quality, and consistency.`
- Show `Why this is REVIEW/PASS/CONFIRMED RISK` as three concise bullets immediately under the decision.

### 7. Report Transition

Current state:

- Preview recommends unlocking the full report.
- Save creates an intake; checkout then creates a payment intent/locked placeholder.
- `/report` separately loads a ready report by query-string reportId and uses a report-specific layout.

UX issues:

- The transition from preview to report is transactional, not experiential.
- Users do not see a clear path from `Decision` to `Report` stage unless they save and unlock.
- The report route loading state does not feel connected to the investigation timeline.

Recommendations:

- Add a final `Report` stage to the timeline with states:
  - `Preview ready`;
  - `Saved to workspace`;
  - `Locked`;
  - `Unlock in progress`;
  - `Ready`.
- After save, show a case-file confirmation: `Investigation saved`, `Preview report ID/intake ID`, `Next: unlock full report`.
- After payment initiation, show `Report locked until payment confirmation` rather than making users infer this from payment copy.
- On `/report`, replace `Preparing report...` with a report continuity skeleton that mirrors the investigation stages.

### 8. Save Flow

Current state:

- The preview requires saving before checkout because `PaymentButtons` is disabled without an intake ID.
- If a session exists, `saveLead` creates an intake; otherwise it saves a preview lead to session storage and marks `leadSaved` true.
- Button copy says `Save Report`, although the actual object is an intake/preview and the full report is locked until payment.

UX issues:

- `Save Report` is ambiguous because the report is not ready and payment has not occurred.
- Signed-out behavior may tell users the lead was saved even though it only lives in session storage.
- The checkout disabled state can feel like friction unless save is framed as a required case-file step.

Recommendations:

- Rename `Save Report` to `Save Investigation` or `Create Case File`.
- Show a two-step panel:
  1. `Save investigation preview`;
  2. `Unlock full report`.
- For signed-out users, explicitly say `Saved in this browser. Create an account to keep investigation history.`
- For signed-in users, show `Saved to workspace` with intake ID and next action.

### 9. Unlock Flow

Current state:

- `PaymentButtons` explains full report unlock and requires legal acceptance before payment options are enabled.
- Payment methods open PayPal or WhatsApp payment request flows.
- Checkout creates a payment intent only when a session exists.

UX issues:

- Unlock is visually separate from the investigation timeline.
- Legal acceptance is necessary, but it dominates the modal and can make unlock feel administrative.
- Users may not know exactly what changes after unlocking.

Recommendations:

- Keep the legal/payment business logic unchanged, but wrap it in a premium unlock explanation:
  - `Unlock evidence hierarchy`;
  - `Unlock full decision rationale`;
  - `Unlock report history`;
  - `Unlock technical provider details`.
- Add a locked report preview with blurred sections or locked rows instead of only a text explanation.
- Show an `Unlock status` in the timeline after payment method selection: `Payment request opened`, `Awaiting confirmation`, `Report generation pending`.
- Use reassuring copy: `Your free preview remains available. Payment unlocks the full report when confirmed.`

## Proposed Investigation Timeline Experience

The premium investigation should be a vertical command timeline with six major stages and nested provider/evidence rows.

### Stage 1: Target

Purpose: establish what is being investigated.

Suggested states:

- Running: `Normalizing target`
- Completed: `Target recognized`
- Failed: `Target could not be interpreted`

Primary UI:

- Raw submitted target.
- Normalized target.
- Target type.
- Confidence.
- Edit/correct action.

### Stage 2: Identity

Purpose: show what ShadowScore believes the target represents.

Suggested states:

- Running: `Resolving identity`
- Completed: `Identity profile prepared`
- Not available: `Public identity evidence not available`

Primary UI:

- Business/persona/entity summary.
- Identity confidence.
- Evidence sources used.
- Missing identity facts.

### Stage 3: Evidence

Purpose: make discovery visible.

Suggested states:

- Running: `Collecting evidence`
- Completed: `Evidence discovered`
- Not available: `No evidence returned by this source`
- Not yet implemented: `Provider not yet implemented`

Primary UI:

- Evidence ledger.
- Provider cards.
- Evidence counts.
- Locked full evidence hierarchy teaser.

### Stage 4: Verification

Purpose: show the analysis step between evidence and decision.

Suggested states:

- Running: `Verifying signal consistency`
- Completed: `Verification complete`
- Failed: `Verification interrupted`

Primary UI:

- Signal consistency.
- Evidence coverage.
- Confidence movement.
- Missing or contradictory signals.

### Stage 5: Decision

Purpose: reveal the recommendation.

Suggested states:

- Running: `Decision forming`
- Completed: `Decision ready`
- Locked: `Full rationale locked`

Primary UI:

- PASS / REVIEW / CONFIRMED RISK.
- Confidence score/level.
- Top reasons.
- Recommended next action.

### Stage 6: Report

Purpose: transition from preview to saved/unlocked report.

Suggested states:

- Preview ready.
- Saved.
- Locked.
- Unlock in progress.
- Ready.

Primary UI:

- Save investigation action.
- Unlock full report action.
- Report readiness state.
- Link to workspace/report when available.

## Animation Recommendations

- Use subtle, professional motion: avoid playful spinners as the main investigation metaphor.
- Use a scanning line or low-opacity pulse on the currently running stage.
- Use staggered provider row reveals at 120–180ms intervals.
- Use a small `elapsed` indicator for running providers to increase realism.
- Use completion transitions that move from skeleton → data card → evidence ledger entry.
- Respect reduced-motion preferences.
- Use decision reveal sparingly: one premium reveal animation after verification, not constant motion.

## Timing Recommendations

- Hero preparation: 400–900ms; enough to feel responsive, not fake.
- Target normalization reveal: immediate or under 300ms once available.
- Provider rows: appear immediately as queued/running; do not wait for completion.
- Evidence cards: reveal as soon as each provider result resolves.
- Decision reveal: wait until provider call completes and preview data exists; then use a short 300–600ms reveal.
- Report transition: immediate visual acknowledgement after save/unlock action, even if backend/payment completion is pending.

## Progress Indicator Recommendations

- Avoid a single percentage unless it is tied to known stages. Percentages can imply false precision.
- Prefer stage-based progress: `2 of 6 stages complete`.
- For providers, show counts: `2 completed · 1 failed · 2 not available · 4 not yet implemented`.
- For evidence, show coverage: `Evidence coverage: 4 of 11 sources` where data exists.
- For locked preview, show visible vs locked: `Preview: 3 signals visible · Full report: 11-source hierarchy`.

## Confidence Display Recommendations

- Use confidence as an explanation, not just a number.
- Pair confidence with drivers:
  - provider coverage;
  - evidence quality;
  - identity consistency;
  - unavailable sources;
  - not-yet-implemented providers.
- For low confidence, explain whether the cause is missing evidence, provider unavailability, or target ambiguity.
- Do not show future/not-implemented providers as negative confidence unless the product intentionally treats missing coverage that way.

## Evidence Visibility Recommendations

- Move key evidence out of collapsed technical details.
- Keep raw provider fields in technical details, but show user-facing evidence cards in the main flow.
- Use labels: `Verified signal`, `Evidence gap`, `Provider unavailable`, `Locked detail`.
- Show unavailable evidence explicitly so missing data feels transparent rather than broken.
- For marketplace/evidence review, show filename-derived evidence as preliminary and label it as `User-provided evidence metadata`, not verified provider evidence.

## Premium Interaction Recommendations

- Convert `/intake` into an investigation workspace with sticky case header: target, mode, status, and next action.
- Add a command-center timeline that remains visible while results reveal below it.
- Use locked premium rows instead of generic upsell copy.
- Rename actions around user intent:
  - `Start Investigation`;
  - `Save Investigation`;
  - `Unlock Full Report`;
  - `Open Report`.
- Add contextual next actions at every state:
  - target unclear → edit target;
  - evidence thin → add evidence;
  - provider failed → retry/contact support;
  - preview ready → save/unlock;
  - report locked → finish payment;
  - report ready → open report.

## Implementation Boundaries

Do not change:

- Decision Engine scoring or outputs.
- Ontology mapping.
- Knowledge Graph behavior.
- Provider execution logic.
- Payment creation, acceptance, or checkout logic.

Safe UX-only implementation areas:

- Presentation components for timeline, provider cards, evidence cards, and loading skeletons.
- Status mapping functions that translate existing provider/result states into UI labels.
- Copy changes for save/unlock/report transition.
- Route-level loading states and client-side progressive reveal choreography.
- Display of already available normalized target/classification fields, provider result metadata, evidence counts, and decision preview fields.

## Priority Plan

### P0: Make loading truthful and premium

- Replace homepage and intake generic progress with status-aware timeline UI.
- Stop showing all running steps as checked.
- Add provider status taxonomy with Running, Completed, Failed, Not Available, and Not Yet Implemented.

### P1: Make provider execution visible

- Move provider grid out of collapsed technical details.
- Show production providers as running/completed/failed.
- Show non-production providers as `Not yet implemented`, not as spinners.

### P2: Add progressive reveal

- Render stages in order: Target → Identity → Evidence → Verification → Decision → Report.
- Reveal each stage as data becomes available.
- Add staged decision reveal after verification.

### P3: Clarify save and unlock

- Rename `Save Report` to `Save Investigation`.
- Add saved/locked/unlock states to the report timeline.
- Clarify signed-out save behavior.

### P4: Upgrade report continuity

- Replace `/report` plain loading text with report continuity skeleton.
- Show report readiness as the final timeline stage.
- Keep technical details as a drawer, but elevate evidence and confidence in the main report body.

## Acceptance Criteria

- Users can see what target ShadowScore is investigating and how it was interpreted.
- Users can see a six-stage investigation timeline from target through report.
- Every configured provider has an explicit user-facing status: Running, Completed, Failed, Not Available, or Not Yet Implemented.
- Generic loading states are replaced by investigation-specific timeline and skeleton states.
- Evidence appears progressively and is visibly tied to provider/source.
- Decision reveal feels earned by prior evidence and verification stages.
- Save and unlock actions clearly communicate investigation/report lifecycle state.
- No business logic, Decision Engine, Ontology, Knowledge Graph, Provider, or Payment behavior is modified.

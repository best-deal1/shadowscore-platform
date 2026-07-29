# ShadowScore product freeze review

## Decision summary

ShadowScore should use one customer model:

> **Business Investigation → Evidence → Executive Report → Archive**

An **Investigation** is the primary product object. An **Executive Report** is its primary output. Evidence supports the report. The Archive stores completed investigations and their reports.

This model should replace the competing models currently expressed through cases, assessments, scans, dashboards, workspaces, trust views, reports, and monitoring views. It applies to navigation, routes, interface copy, product documentation, support language, analytics events, and API documentation. Internal implementation names may remain during migration, but they must not appear as alternate customer concepts.

This review recommends architecture only. It does not authorize route changes, copy changes, feature work, or UI redesign.

## Scope and review method

The review covered:

- Public, authenticated, administrative, and experimental routes under `app/`.
- Shared navigation, workspace navigation, headings, calls to action, and report components.
- Product and architecture documents in the repository root and `docs/`.
- Repeated nouns in route names, SEO metadata, interface copy, types, and service boundaries.

The standard used for each customer-facing surface was: does it help a customer start an investigation, review its evidence, receive its Executive Report, or retrieve that report later?

## Current architecture

### Current customer journeys

The repository presents several journeys at the same time:

1. **Marketing journey:** product or use-case page → intake or free scan → payment → report.
2. **Investigation journey:** investigations list → investigation status → report.
3. **Case-management journey:** workspace → case → timeline, findings, decision, and report.
4. **Portal journey:** dashboard or account → reports, monitoring, watchlist, alerts, and history.
5. **Intelligence journey:** entity intelligence → trust intelligence → risk radar or analysis.
6. **Operations journey:** quality dashboard, leads, admin consoles, runtime views, and provider data.

Each journey contains useful work, but the product does not establish which journey is authoritative. A customer can reasonably interpret Investigation, Case, Assessment, Scan, and Report as five different products.

### Current route families

| Family | Current routes | Current job | Architectural finding |
| --- | --- | --- | --- |
| Acquisition | `/`, `/business-due-diligence`, `/business-background-check`, `/company-check`, `/company-extract`, `/company-registry-search`, `/marketplace-seller-verification`, `/supplier-verification`, Hebrew equivalents | Explain use cases and acquire customers | Keep as acquisition pages. They must describe one Investigation product and must not create product-level synonyms. |
| Product education | `/methodology`, `/sample-report`, `/example-report`, `/pricing`, `/security`, `/about`, `/contact` | Explain method, output, price, trust, and company | Keep. Merge the two report examples into one canonical Sample Executive Report destination. Methodology should describe the canonical four-stage model. |
| Entry and access | `/intake`, `/login`, `/signup`, `/upgrade`, `/account` | Start work, authenticate, purchase, and manage the account | Keep the jobs. Name the entry action **Start Investigation**. Account remains an account utility, not a product area. |
| Investigation records | `/investigations`, `/investigations/[investigationId]`, `/cases/[caseId]`, `/workspace` | List and review active work | Merge into **Investigations**. A case is an investigation record, not a second customer object. Workspace is a shell, not a destination. |
| Report delivery | `/report`, `/report/analysis`, `/reports`, `/reports/[reportId]`, processing and unlock routes | Preview, process, unlock, list, and display reports | Preserve processing states, but expose one Executive Report destination within its Investigation. Move the standalone reports list into Archive. Retire ambiguous singular report and analysis destinations. |
| Ongoing signal views | `/monitoring`, `/workspace/monitoring`, `/workspace/monitoring/[entityId]`, `/watchlist`, `/alerts` | Track businesses and changes after a report | Overlapping and not part of the frozen core. Remove from primary navigation now. Reconsider later as one Follow-up capability attached to an Investigation. |
| Intelligence demonstrations | `/analysis`, `/radar`, `/entity-intelligence`, `/entity-runtime`, `/trust-intelligence` | Show analysis, identity resolution, runtime health, trust, and risk signals | These mix product surfaces, demonstrations, and operations. Evidence and identity work should live inside an Investigation. Runtime health belongs to operations. Risk Radar and Trust Intelligence should not remain separate customer destinations. |
| Internal operations | `/admin`, `/admin-lite`, `/quality`, `/leads` | Operate delivery, quality, and sales | Keep behind internal access. Remove from customer navigation and vocabulary governance except where staff communicate with customers. Merge Admin Lite into Admin when permissions allow. |
| Legal and brand | `/privacy`, `/terms`, `/brand` | Publish legal terms and maintain the design system | Keep legal pages in the footer. Treat Brand as internal documentation unless there is a clear public audience. |

### Current navigation

The public header currently combines Product, Sample report, Methodology, Pricing, and Security with sign-in and start actions. Mobile navigation adds About, Privacy, Terms, and Contact. The footer introduces another product grouping and points to a different example-report route.

The authenticated product has multiple possible top levels: Dashboard, Workspace, Investigations, Reports, Monitoring, Watchlist, Alerts, and Account. The workspace shell itself uses Cases and Monitoring. This creates three structural problems:

1. The same work appears under Dashboard, Workspace, Investigations, and Cases.
2. The same output appears as Report, Reports, Executive Report, Trust Report, Business Analysis, and Assessment.
3. Monitoring is split across Monitoring, Workspace Monitoring, Watchlist, Alerts, History, and Risk Radar.

## Problems

### No stable primary object

The codebase uses **Business**, **Subject**, **Entity**, **Target**, **Company**, **Case**, and **Investigation** for related records. Some differences are legitimate in the data model, but customers cannot tell which object they own or return to.

### The output has several names

Executive Report, Executive Intelligence Report, Trust Report, Investigation Report, Risk Assessment Report, Website Intelligence Report, Business Analysis, and report are presented as if they might be different deliverables. This weakens the purchase promise and makes report history hard to understand.

### Containers are presented as products

Dashboard, Workspace, Command Center, and portal describe interface containers. They do not describe a customer job. Giving them equal navigation weight makes the information architecture reflect implementation history rather than customer intent.

### Evidence work is fragmented

Analysis, findings, provider results, identity resolution, trust intelligence, risk signals, timelines, and decisions all contribute to the same report. Separate top-level pages make them look like unrelated products.

### Monitoring is duplicated and premature

Monitoring, Watchlist, Alerts, Risk Radar, score history, and monitoring history represent one future job: detect material change after an investigation. Their present separation implies capabilities and persistence that are not yet one coherent product.

### Routes encode old concepts

Several routes are historical or parallel implementations. Route names are part of product language because they appear in links, analytics, support instructions, browser history, and documentation. A vocabulary freeze that changes headings but ignores routes would remain incomplete.

### Documentation preserves conflicting strategies

Repository documents describe both a report purchase product and a permanent workspace with dashboards, watchlists, timelines, trust intelligence, and monitoring. Historical documents are useful records, but without a canonical decision they continue to act as competing specifications.

## Mental model evaluation

### Option A: Subject → Assessments → Monitoring → History

**Strengths**

- Works well for a mature portfolio product that repeatedly evaluates the same business.
- Makes longitudinal monitoring and history natural.
- Supports one business with several assessment cycles.

**Weaknesses**

- **Subject** is abstract and sounds investigative rather than commercial.
- **Assessment** understates the evidence collection, identity work, review, and decision record already present.
- It makes Monitoring a required stage even though monitoring is not part of the frozen core.
- It does not make the Executive Report the obvious purchased deliverable.

**Decision:** reject for the current product. It may become useful only after recurring follow-up is proven.

### Option B: Investigation → Evidence → Report → Archive

**Strengths**

- Matches the existing intake, collection, review, and delivery flow.
- Gives every supporting capability a clear place inside one bounded record.
- Makes the purchased output explicit.
- Works for one-time reports today and can support repeat investigations later.
- Avoids requiring monitoring, subscriptions, or enterprise workflow.

**Weaknesses**

- Investigation can sound formal. Public copy must define it plainly as a structured review of a business.
- The business being reviewed still needs a consistent field name.
- A generic Report label does not distinguish the final deliverable from previews or internal quality records.

**Decision:** adopt Option B with two refinements. Use **Business Investigation** when first introducing the concept. Use **Executive Report** for the final deliverable.

## Canonical product model

### 1. Investigation

The customer starts an Investigation for one Business. The Investigation owns status, scope, timestamps, evidence, review activity, payment and access state, and one current Executive Report.

An Investigation can be in one of these customer-visible states:

- **Draft:** required input is incomplete.
- **In progress:** evidence is being collected or evaluated.
- **Needs input:** customer action is required.
- **In review:** evidence or conclusions require review.
- **Report ready:** the Executive Report is available.
- **Archived:** the Investigation is retained but no longer active.

Processing, payment, provider, and internal quality states can remain internal. They should map to one of these customer states rather than expanding the customer vocabulary.

### 2. Evidence

Evidence is the source material and derived finding set used to support the Executive Report. Identity matches, provider observations, risk signals, findings, confidence, and source timestamps are evidence attributes or views. They are not top-level products.

### 3. Executive Report

The Executive Report is the decision-ready customer deliverable produced by an Investigation. A preview is an **Executive Report Preview**. A sample is a **Sample Executive Report**. An updated version is an **Executive Report version**, not a new report type.

Every customer screen should help the customer:

- start the Investigation correctly,
- understand its state,
- review or supply evidence,
- read, unlock, export, or share the Executive Report, or
- retrieve a completed Investigation from the Archive.

### 4. Archive

Archive is the list of completed and archived Investigations. It replaces a standalone Reports library, report history, scan history, and ambiguous dashboard history. Each row opens the Investigation, whose primary action is **View Executive Report**.

## Final vocabulary

| Canonical term | Exact meaning | Replace or constrain |
| --- | --- | --- |
| **Business** | The company or commercial organization being investigated | Replace customer-facing Subject, Entity, Target, Company profile, and Monitored entity. Entity may remain an internal data-model term. Target may remain an API input field until migrated. |
| **Investigation** | One bounded review of one Business that produces an Executive Report | Replace Assessment, Scan, Check, Analysis, Case, and review when they name the product object. Use check and analysis only as ordinary verbs when needed. |
| **Evidence** | Sourced material and findings that support the Executive Report | Absorb Signals, Intelligence, Provider Results, Findings, Identity Candidates, and Trust Drivers as subordinate labels where a more specific evidence type is required. |
| **Executive Report** | The final customer deliverable from an Investigation | Replace Trust Report, Business Analysis, Risk Assessment Report, Investigation Report, Website Intelligence Report, and generic Report when referring to the deliverable. |
| **Executive Report Preview** | A limited view shown before purchase or completion | Replace Free Scan, Preview Report, preliminary assessment, and locked report as product nouns. **Locked** may describe access state. |
| **Investigations** | The active-work list and authenticated home | Replace Dashboard, Workspace, Command Center, Active Cases, and portal as destinations. |
| **Archive** | Completed and archived Investigations, including their Executive Reports | Replace Reports list, Report History, Scan History, and Saved Reports as destinations. |
| **Account** | Profile, organization, billing, legal acceptance, and access settings | Keep. Do not call it Workspace settings. |
| **Status** | The current stage of an Investigation | Replace lifecycle synonyms where they refer to progress. Risk level and confidence remain separate report attributes. |

### Terms allowed only in internal or technical contexts

- **Entity:** resolved data record in the identity and relationship model.
- **Subject:** evidence-platform identifier where a neutral typed resource is required.
- **Case:** legacy persistence or API name during migration.
- **Workspace:** organization and authorization boundary in code.
- **Provider:** source adapter or collection module.
- **Dashboard:** a UI layout pattern, never a destination or product name.

These terms must not appear in customer navigation, sales copy, onboarding, support instructions, or the names of new customer-facing routes.

## Report-centered screen review

| Screen or concept | Contribution to the Executive Report | Recommendation |
| --- | --- | --- |
| Homepage and use-case pages | Explain why to start an Investigation | Keep. Point all primary actions to Start Investigation. Use cases remain acquisition context, not product variants. |
| Intake | Defines the Business and Investigation scope | Keep as the Start Investigation flow. |
| Investigation list, dashboard, workspace, command center | Helps customers resume active work | Merge into Investigations. Use one list with status and next action. |
| Investigation detail and case detail | Organizes evidence and report production | Merge into one Investigation detail. Evidence, activity, and report state belong here. |
| Analysis and report analysis | Supports report conclusions | Move into the Evidence section of an Investigation. Remove as standalone destinations. |
| Entity intelligence | Resolves the correct Business | Keep the capability inside Evidence. Do not expose it as a separate product. |
| Trust intelligence and Risk Radar | Summarize evidence and risk | Put supported conclusions in the Executive Report and supporting signals in Evidence. Remove standalone destinations. |
| Report processing and unlock | Communicate delivery and access state | Keep as states of the Investigation and Executive Report. Avoid separate navigation. |
| Reports list | Retrieves past deliverables | Merge into Archive, organized by Investigation. |
| Sample report and example report | Demonstrate the deliverable | Merge into Sample Executive Report. |
| Monitoring, watchlist, alerts, monitoring history | Detect change after delivery | Remove from the frozen core and primary navigation. Preserve as a future concept only. |
| Account and upgrade | Manage identity and access to delivery | Keep as utilities. Link purchase actions to the relevant Investigation when possible. |
| Methodology, security, legal | Establish how evidence is handled | Keep as supporting public information. |
| Admin, quality, leads, runtime | Support internal delivery | Keep internal. Align staff labels with Investigation and Executive Report where those records are customer-visible. |

## Final navigation

### Final public navigation

| Item | Unique job | Decision |
| --- | --- | --- |
| **Product** | Explain the Business Investigation and its Executive Report | Keep. One overview, not a family of product names. |
| **Sample Executive Report** | Show the exact customer deliverable | Keep. Merge Sample Report and Example Report. |
| **Methodology** | Explain how Evidence supports conclusions | Keep. |
| **Pricing** | Explain the price and access conditions for an Investigation | Keep. |
| **Security** | Explain data handling and security controls | Keep. |
| **Sign in** | Return an existing customer to Investigations | Keep as a utility. |
| **Start Investigation** | Begin the primary workflow | Keep as the only primary call to action. |

About and Contact belong in the footer. Privacy and Terms remain footer utilities. Acquisition pages remain indexable landing pages, but do not join the primary navigation.

### Final authenticated navigation

| Item | Unique job | Decision |
| --- | --- | --- |
| **Investigations** | Start, find, and resume active Investigations | Keep. This is the authenticated home. |
| **Archive** | Retrieve completed or archived Investigations and Executive Reports | Keep. |
| **Account** | Manage profile, organization, billing, and access | Keep as a utility, visually separate from product navigation. |
| **Start Investigation** | Create an Investigation | Keep as the primary action, not a navigation section. |

No Dashboard, Workspace, Cases, Reports, Command Center, Risk Radar, Monitoring, Watchlist, or Alerts item should appear in the frozen primary navigation.

### Navigation item disposition

| Current item | Why it exists today | Unique job | Freeze decision |
| --- | --- | --- | --- |
| Dashboard | Summary of current activity | None beyond active-work discovery | Merge into Investigations. |
| Workspace | Container for team work | None as a customer destination | Remove from navigation. Retain as an internal authorization boundary. |
| Cases | Queue for analyst records | Same job as Investigations | Rename and merge into Investigations. |
| Investigations | Tracks work that produces a report | Primary active-work job | Keep as canonical. |
| Reports | Lists deliverables | Retrieval of completed work | Merge into Archive. |
| Command Center | Branded dashboard label | Same job as Dashboard | Remove. |
| Risk Radar | Displays risk signals | Same evidence supports the report | Merge into Investigation Evidence. |
| Monitoring | Tracks later changes | Future post-report job | Remove from primary navigation now. |
| Watchlist | Selects businesses for monitoring | Sub-step of future follow-up | Remove now. |
| Alerts | Presents monitoring changes | Sub-step of future follow-up | Remove now. |
| History or Timeline | Shows activity or changes | Context within one Investigation | Keep only inside Investigation as **Activity**. Use Archive for completed records. |

## Final proposed product structure

```text
ShadowScore
├── Public
│   ├── Product
│   ├── Sample Executive Report
│   ├── Methodology
│   ├── Pricing
│   └── Security
├── Investigations
│   ├── Start Investigation
│   └── Investigation
│       ├── Overview
│       ├── Evidence
│       ├── Activity
│       └── Executive Report
├── Archive
│   └── Archived Investigation
│       └── Executive Report
└── Account
```

### Purpose of each Investigation section

- **Overview:** Business, Investigation status, scope, owner if relevant, and next action.
- **Evidence:** sources, identity confidence, findings, limitations, and evidence-level review.
- **Activity:** a chronological record of material Investigation events. It is not monitoring history.
- **Executive Report:** preview, access state, current version, export, and share actions.

Each section has one job. Any content that does not fit one of these jobs should be internal, removed, or deferred.

## Concepts to remove

Remove these as customer-facing product concepts:

- Assessment as the name of an Investigation or Executive Report.
- Business Analysis, Trust Report, Risk Assessment Report, Investigation Report, Website Intelligence Report, and Executive Intelligence Report as alternate deliverable names.
- Dashboard, Workspace, Command Center, and portal as destinations.
- Case as a customer object.
- Risk Radar and Trust Intelligence as standalone products.
- Free Scan as a product object. Present it as an Executive Report Preview within a new Investigation.
- Saved Reports and Scan History as separate collections.
- Subject, Entity, and Target as customer labels for the Business.

Removal means removal from the customer vocabulary first. Physical route and schema migration requires a separate implementation plan with redirects, compatibility periods, analytics mapping, and API versioning.

## Concepts to merge

| Merge | Canonical destination |
| --- | --- |
| Dashboard + Workspace + Command Center + Cases + Investigations list | **Investigations** |
| Case detail + Investigation detail | **Investigation** |
| Reports + Saved Reports + Report History + completed scan history | **Archive** |
| Sample Report + Example Report | **Sample Executive Report** |
| Analysis + Findings + Provider Results + identity candidates + risk signals + trust drivers | **Investigation → Evidence** |
| Report + Trust Report + Business Analysis + assessment report variants | **Investigation → Executive Report** |
| Timeline + investigation event history | **Investigation → Activity** |
| Monitoring + Watchlist + Alerts + monitoring history + Risk Radar | Future **Follow-up**, pending validation |
| Admin Lite + Admin Console | **Admin**, pending internal permission review |

## Future concepts, not now

The freeze leaves space for future capabilities without making them part of the current promise:

### Follow-up

If customers prove a recurring need after receiving an Executive Report, define one capability named **Follow-up**. It may later contain watched Businesses, material changes, alerts, and scheduled report updates. Do not add it to navigation until persistence, entitlement, alert quality, ownership, and the relationship to report versions are defined.

### Repeat investigations

A Business may later have multiple Investigations. Introduce a Business portfolio only when customers need to compare or manage those investigations together. Until then, Business is a field of an Investigation, not a top-level destination.

### Collaboration

Owners, reviewers, assignments, and approvals can remain attributes and actions within an Investigation. Do not create a Collaboration product area.

### API and integrations

APIs may create Investigations, add Evidence, and retrieve Executive Reports. They should mirror the canonical model rather than expose internal workspace, case, subject, or provider organization.

### Enterprise controls

Roles, policies, audit export, and organization controls belong in Account or internal administration until a proven customer job requires a separate information architecture.

## Governance and migration recommendations

No implementation belongs in this PR. A later implementation sequence should follow these rules:

1. Approve this document as the vocabulary source of truth.
2. Create a route and copy inventory that maps every customer string and URL to the canonical model.
3. Update navigation before changing deep screens, with redirects for removed public routes.
4. Consolidate Investigation records before consolidating the Executive Report routes.
5. Move completed Investigations into Archive only after status mapping is explicit.
6. Remove monitoring concepts from primary navigation without deleting data or internal services.
7. Mark historical documents as superseded rather than rewriting release history.
8. Add a vocabulary check to product review. New customer nouns require an architecture decision.

### Vocabulary acceptance test

Before a later implementation PR is accepted, a reviewer should be able to answer yes to each question:

- Does the screen identify one Business and one Investigation where applicable?
- Does it use Executive Report for the customer deliverable?
- Does every evidence view explain how it supports the Executive Report?
- Is the screen reachable through Investigations, Archive, Account, or a public education path?
- Does the screen avoid Dashboard, Workspace, Case, Assessment, Scan, Trust Report, and other frozen synonyms as product nouns?
- Does every primary action advance the Investigation or provide the Executive Report?

## Five-minute explanation for a new team member

ShadowScore investigates a Business and produces an Executive Report. A customer starts an Investigation, ShadowScore gathers and evaluates Evidence, and the Investigation produces the Executive Report. Active work lives in Investigations. Completed work lives in Archive. Account contains customer and billing settings. Every other capability either supports Evidence, supports report delivery, belongs to internal operations, or is a future concept.

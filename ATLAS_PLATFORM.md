# Atlas Platform Architecture

## Vision

Atlas is the shared operating platform for digital business. It provides the reusable infrastructure, APIs, data foundations, intelligence layers, and governance controls that future products need in order to launch quickly without rebuilding common capabilities.

ShadowScore is the first commercial product built on Atlas, but Atlas is intentionally broader than any single product. Every product should strengthen Atlas, and every improvement to Atlas should benefit all products.

The long-term vision is for Atlas to become the foundational platform behind products such as ShadowScore, Trust Marketplace, Tipit, SalaryGuard, Atlas Commerce, and future AI-native business tools. Products should consume Atlas capabilities through stable, versioned APIs instead of duplicating identity, payments, risk, provider integrations, reporting, commerce, or intelligence logic.

## Core Services

### Identity

#### Purpose

Identity is the canonical system of record for people, organizations, accounts, profiles, roles, and ownership relationships across Atlas-powered products.

#### Responsibilities

- Maintain user, organization, team, and service-account records.
- Model relationships between users, workspaces, companies, merchants, providers, buyers, sellers, and internal operators.
- Store product-neutral profile metadata that can be reused across Atlas products.
- Provide identity resolution for duplicated or linked accounts.
- Support role, permission, and membership primitives used by the Workspace and Authentication services.
- Maintain audit-friendly identity lifecycle events such as creation, verification, suspension, deletion, and merge history.

#### Public APIs

- `POST /v1/identities/users`
- `GET /v1/identities/users/{user_id}`
- `PATCH /v1/identities/users/{user_id}`
- `POST /v1/identities/organizations`
- `GET /v1/identities/organizations/{organization_id}`
- `POST /v1/identities/relationships`
- `GET /v1/identities/search`
- `GET /v1/identities/{identity_id}/events`

#### Dependencies

- Authentication for login, session, and credential binding.
- Workspace for memberships and product access boundaries.
- Risk Engine for identity risk signals.
- Provider Engine for third-party enrichment and verification data.
- Reporting for identity analytics and lifecycle reporting.
- Monitoring for identity service health, latency, and event integrity.

#### Future extensions

- Global identity graph spanning all Atlas products.
- Decentralized identity and verifiable credential support.
- Advanced duplicate detection and account-linking intelligence.
- Business identity verification and beneficial-owner modeling.
- Delegated identity administration for enterprise customers.

### Authentication

#### Purpose

Authentication verifies that actors are who they claim to be and issues secure access to Atlas APIs and products.

#### Responsibilities

- Support login, logout, registration, passwordless authentication, single sign-on, and multi-factor authentication.
- Issue, refresh, revoke, and introspect access tokens.
- Enforce account lockout, session security, device trust, and credential policies.
- Integrate with enterprise identity providers through SAML, OAuth, and OpenID Connect.
- Provide machine-to-machine authentication for internal services and external API clients.
- Emit authentication events for audit, risk analysis, and monitoring.

#### Public APIs

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/token/refresh`
- `POST /v1/auth/token/introspect`
- `POST /v1/auth/mfa/challenge`
- `POST /v1/auth/mfa/verify`
- `POST /v1/auth/sso/callback`
- `GET /v1/auth/sessions`
- `DELETE /v1/auth/sessions/{session_id}`

#### Dependencies

- Identity for users, organizations, roles, and account status.
- Workspace for product and workspace authorization boundaries.
- Risk Engine for adaptive authentication and suspicious-login detection.
- Notifications for verification links, MFA codes, and security alerts.
- Monitoring for abuse detection, token anomalies, and authentication availability.

#### Future extensions

- Passkey-first authentication.
- Adaptive authentication based on behavior, location, device, and risk score.
- Customer-managed authentication policies.
- Fine-grained API key governance for external developers.
- Continuous session risk evaluation.

### Workspace

#### Purpose

Workspace defines the collaborative and commercial boundary where users, teams, products, resources, data, and billing relationships are organized.

#### Responsibilities

- Create and manage workspaces for individuals, teams, merchants, businesses, and enterprises.
- Manage workspace memberships, invitations, roles, and permissions.
- Provide product entitlement boundaries across ShadowScore, Tipit, SalaryGuard, Trust Marketplace, Atlas Commerce, and future products.
- Store workspace configuration such as region, locale, branding, policies, and enabled modules.
- Support tenant isolation, data partitioning, and workspace-level audit trails.
- Provide shared workspace context to all Atlas services.

#### Public APIs

- `POST /v1/workspaces`
- `GET /v1/workspaces/{workspace_id}`
- `PATCH /v1/workspaces/{workspace_id}`
- `POST /v1/workspaces/{workspace_id}/members`
- `PATCH /v1/workspaces/{workspace_id}/members/{member_id}`
- `DELETE /v1/workspaces/{workspace_id}/members/{member_id}`
- `POST /v1/workspaces/{workspace_id}/invitations`
- `GET /v1/workspaces/{workspace_id}/entitlements`
- `GET /v1/workspaces/{workspace_id}/audit-events`

#### Dependencies

- Identity for users, organizations, and membership actors.
- Authentication for access enforcement.
- Payments for plans, subscriptions, invoices, and usage billing.
- Reporting for tenant analytics.
- Monitoring for workspace-level operational health.

#### Future extensions

- Enterprise hierarchy support with parent and child workspaces.
- Cross-workspace collaboration and delegated administration.
- Workspace-level data residency controls.
- Policy-as-code for enterprise governance.
- Product bundle management across the Atlas portfolio.

### Payments

#### Purpose

Payments is the shared financial infrastructure for billing, subscriptions, invoicing, payouts, refunds, credits, taxes, and product monetization.

#### Responsibilities

- Process customer payments for Atlas-powered products.
- Manage subscriptions, usage-based billing, invoices, plans, discounts, credits, and payment methods.
- Support marketplace payouts and revenue sharing.
- Handle refunds, disputes, chargebacks, tax calculation, and ledger reconciliation.
- Provide payment status events to Commerce Engine, Escrow, Marketplace Engine, and product-specific workflows.
- Maintain financial audit trails and reconciliation exports.

#### Public APIs

- `POST /v1/payments/customers`
- `POST /v1/payments/payment-methods`
- `POST /v1/payments/charges`
- `POST /v1/payments/refunds`
- `POST /v1/payments/subscriptions`
- `PATCH /v1/payments/subscriptions/{subscription_id}`
- `GET /v1/payments/invoices/{invoice_id}`
- `POST /v1/payments/payouts`
- `GET /v1/payments/ledger-entries`
- `POST /v1/payments/webhooks/provider-events`

#### Dependencies

- Identity for customer, merchant, buyer, and seller records.
- Workspace for billing ownership and entitlements.
- Commerce Engine for orders and checkout.
- Escrow for held funds and release logic.
- Marketplace Engine for seller payouts and fees.
- Risk Engine for fraud checks and payment risk.
- Reporting for financial analytics.
- Monitoring for processor availability and reconciliation failures.

#### Future extensions

- Multi-provider payment routing.
- Global tax and compliance expansion.
- Native wallet balances and stored value where legally supported.
- Advanced marketplace fee configuration.
- Automated revenue recognition and finance integrations.

### Notifications

#### Purpose

Notifications provides a centralized messaging layer for transactional, operational, lifecycle, marketing-consented, and security communications across Atlas products.

#### Responsibilities

- Send email, SMS, push, in-app, webhook, and future channel notifications.
- Manage templates, localization, personalization, and product branding.
- Enforce user preferences, consent, suppression lists, and delivery policies.
- Support transactional events such as authentication, payments, risk alerts, orders, disputes, reports, escrow updates, and marketplace activity.
- Track delivery, opens, clicks, bounces, failures, and retries.
- Provide notification audit trails for compliance and customer support.

#### Public APIs

- `POST /v1/notifications/send`
- `POST /v1/notifications/templates`
- `PATCH /v1/notifications/templates/{template_id}`
- `GET /v1/notifications/preferences/{identity_id}`
- `PATCH /v1/notifications/preferences/{identity_id}`
- `GET /v1/notifications/messages/{message_id}`
- `POST /v1/notifications/webhooks/provider-events`

#### Dependencies

- Identity for recipients and contact channels.
- Workspace for branding and tenant-specific communication rules.
- Authentication for security notifications.
- Payments, Commerce Engine, Escrow, Marketplace Engine, Risk Engine, and AI Engine for event-driven messages.
- Monitoring for delivery health and provider failures.

#### Future extensions

- AI-personalized notification timing and copy where consented.
- Cross-product notification center.
- Customer-configurable workflow automation.
- Multi-provider channel failover.
- Real-time notification preference intelligence.

### Provider Engine

#### Purpose

Provider Engine is the integration layer for external data providers, payment processors, communication vendors, AI model providers, identity verification vendors, commerce integrations, and other third-party systems.

#### Responsibilities

- Standardize provider contracts behind product-neutral Atlas interfaces.
- Route requests to providers based on capability, region, price, reliability, risk, and policy.
- Normalize third-party responses into canonical Atlas data models.
- Manage provider credentials, rate limits, retries, circuit breakers, and observability.
- Track provider cost, quality, latency, accuracy, and availability.
- Provide test harnesses, replay tools, and sandbox adapters.

#### Public APIs

- `POST /v1/providers/requests`
- `GET /v1/providers/requests/{request_id}`
- `GET /v1/providers/capabilities`
- `POST /v1/providers/routing-policies`
- `PATCH /v1/providers/routing-policies/{policy_id}`
- `GET /v1/providers/health`
- `GET /v1/providers/costs`

#### Dependencies

- Identity for provider account ownership.
- Workspace for tenant-specific provider configuration.
- Risk Engine for provider trust and decisioning.
- AI Engine for model provider routing.
- Payments for processor integrations.
- Notifications for communication vendors.
- Monitoring for provider health and incident detection.

#### Future extensions

- Provider marketplace for approved integration partners.
- Automatic provider benchmarking and dynamic routing.
- Bring-your-own-provider support for enterprise customers.
- Provider contract testing and certification.
- Cross-provider evidence reconciliation.

### Risk Engine

#### Purpose

Risk Engine evaluates identity, transaction, marketplace, payment, commerce, provider, and behavioral risk across Atlas products.

#### Responsibilities

- Score risk for users, businesses, payments, orders, providers, claims, listings, payouts, and account activity.
- Combine rules, machine learning, provider evidence, behavioral analytics, and human review outcomes.
- Provide explainable decisions and reason codes.
- Support allow, deny, review, hold, step-up authentication, escrow, payout delay, and monitoring actions.
- Maintain risk policy versions and decision audit trails.
- Feed product experiences such as ShadowScore trust scoring, Trust Marketplace seller quality, and SalaryGuard employer or worker risk.

#### Public APIs

- `POST /v1/risk/evaluate`
- `GET /v1/risk/decisions/{decision_id}`
- `POST /v1/risk/policies`
- `PATCH /v1/risk/policies/{policy_id}`
- `GET /v1/risk/signals/{entity_id}`
- `POST /v1/risk/reviews`
- `PATCH /v1/risk/reviews/{review_id}`
- `GET /v1/risk/explanations/{decision_id}`

#### Dependencies

- Identity for entity resolution.
- Authentication for login and session risk.
- Provider Engine for verification, fraud, and enrichment sources.
- Payments for financial risk signals.
- Commerce Engine, Escrow, and Marketplace Engine for transactional context.
- AI Engine for model-assisted scoring and anomaly detection.
- Reporting for decision analytics.
- Monitoring for drift, latency, and incident response.

#### Future extensions

- Product-specific risk models built on shared signals.
- Automated risk policy simulation before deployment.
- Human-in-the-loop review workbench.
- Federated risk intelligence across products.
- Continuous model monitoring, fairness checks, and explainability dashboards.

### AI Engine

#### Purpose

AI Engine provides shared AI capabilities for reasoning, extraction, classification, prediction, content generation, workflow automation, and agentic product experiences.

#### Responsibilities

- Expose common AI APIs for prompts, agents, embeddings, retrieval, classification, summarization, and structured extraction.
- Route model calls through Provider Engine based on cost, capability, latency, privacy, and reliability.
- Manage prompts, tools, model versions, evaluation sets, safety policies, and output schemas.
- Provide reusable intelligence components for ShadowScore analysis, marketplace trust signals, support automation, salary risk insights, commerce recommendations, and future AI products.
- Maintain evidence links, model outputs, confidence scores, and evaluation traces.
- Enforce data privacy, model access controls, and human approval workflows where needed.

#### Public APIs

- `POST /v1/ai/completions`
- `POST /v1/ai/agents/runs`
- `GET /v1/ai/agents/runs/{run_id}`
- `POST /v1/ai/embeddings`
- `POST /v1/ai/classifications`
- `POST /v1/ai/extractions`
- `POST /v1/ai/evaluations`
- `GET /v1/ai/models`
- `GET /v1/ai/traces/{trace_id}`

#### Dependencies

- Provider Engine for model provider abstraction and routing.
- Identity and Workspace for access controls and tenant-specific data boundaries.
- Risk Engine for safety, fraud, and trust decisions.
- Reporting for AI usage, quality, cost, and performance analytics.
- Monitoring for model latency, failure rates, drift, and safety incidents.

#### Future extensions

- Reusable domain agents for commerce, trust, finance, compliance, and operations.
- Product-specific copilots powered by shared Atlas memory and tools.
- Model evaluation marketplace and benchmark suite.
- Customer-controlled AI policy configuration.
- Fine-tuned and domain-adapted models where justified by evidence.

### Reporting

#### Purpose

Reporting provides the analytics, dashboards, exports, event models, and business intelligence foundation used by Atlas services and products.

#### Responsibilities

- Define canonical metrics, dimensions, facts, and product-neutral reporting events.
- Provide dashboards for product, financial, risk, operational, provider, AI, commerce, and marketplace performance.
- Support scheduled reports, data exports, audit reports, and customer-facing analytics.
- Maintain event lineage, metric definitions, and versioned reporting models.
- Provide self-serve reporting APIs for internal teams and customers.
- Enable evidence-driven decisions across product and engineering.

#### Public APIs

- `POST /v1/reporting/events`
- `GET /v1/reporting/dashboards/{dashboard_id}`
- `POST /v1/reporting/queries`
- `GET /v1/reporting/reports/{report_id}`
- `POST /v1/reporting/reports/{report_id}/exports`
- `GET /v1/reporting/metrics`
- `GET /v1/reporting/lineage/{dataset_id}`

#### Dependencies

- All Atlas services as event producers.
- Identity and Workspace for tenant, user, and organization dimensions.
- Payments for revenue and financial reporting.
- Risk Engine for decision and score analytics.
- AI Engine for AI usage and quality reporting.
- Monitoring for operational telemetry correlation.

#### Future extensions

- Customer-facing analytics builder.
- Metric store with strict semantic definitions.
- Predictive analytics and forecasting.
- Cross-product executive reporting.
- Compliance-grade immutable reporting archives.

### Monitoring

#### Purpose

Monitoring provides the observability, reliability, incident response, auditability, and operational intelligence layer for Atlas.

#### Responsibilities

- Collect metrics, logs, traces, events, uptime checks, and synthetic tests.
- Define service-level objectives, alerts, escalation paths, and runbooks.
- Monitor API performance, provider health, queue depth, job failures, security anomalies, AI quality, and payment reliability.
- Support incident management, postmortems, and reliability reporting.
- Provide audit-grade operational visibility for critical Atlas workflows.
- Correlate product-level impact with platform-level failures.

#### Public APIs

- `POST /v1/monitoring/events`
- `POST /v1/monitoring/metrics`
- `GET /v1/monitoring/services/{service_id}/health`
- `GET /v1/monitoring/incidents/{incident_id}`
- `POST /v1/monitoring/incidents`
- `PATCH /v1/monitoring/incidents/{incident_id}`
- `GET /v1/monitoring/slo-reports`

#### Dependencies

- All Atlas services as telemetry producers.
- Provider Engine for third-party dependency health.
- Notifications for alert delivery.
- Reporting for reliability and operational analytics.
- Authentication and Identity for operator access controls.

#### Future extensions

- Automated remediation for known failure modes.
- Product-impact-aware incident routing.
- AI-assisted incident triage and postmortem generation.
- Customer-facing status and reliability reports.
- Reliability scoring for services and providers.

### API Gateway

#### Purpose

API Gateway is the unified entry point for Atlas APIs, product APIs, partner integrations, and internal service-to-service access.

#### Responsibilities

- Route requests to Atlas services and product-specific APIs.
- Enforce authentication, authorization, rate limits, quotas, schema validation, and request policies.
- Provide API versioning, compatibility management, deprecation workflows, and documentation hooks.
- Support partner API keys, webhook verification, idempotency keys, and request tracing.
- Normalize error contracts and response envelopes.
- Protect Atlas from abuse, malformed requests, and traffic spikes.

#### Public APIs

- `GET /v1/catalog/services`
- `GET /v1/catalog/apis`
- `POST /v1/api-keys`
- `PATCH /v1/api-keys/{api_key_id}`
- `DELETE /v1/api-keys/{api_key_id}`
- `GET /v1/usage/api-requests`
- `POST /v1/webhooks/endpoints`
- `PATCH /v1/webhooks/endpoints/{endpoint_id}`

#### Dependencies

- Authentication for token validation.
- Identity and Workspace for authorization context.
- Monitoring for request telemetry and abuse detection.
- Reporting for API usage analytics.
- Risk Engine for suspicious API behavior.

#### Future extensions

- Public developer portal for Atlas APIs.
- GraphQL or federated query layer where useful.
- Customer-specific API products and quotas.
- API contract testing and automated compatibility checks.
- Edge routing for global latency reduction.

### Commerce Engine

#### Purpose

Commerce Engine provides reusable primitives for selling products, services, subscriptions, digital goods, marketplace listings, and future commercial offerings.

#### Responsibilities

- Manage catalogs, products, SKUs, pricing, carts, checkout sessions, orders, fulfillment states, discounts, and taxes.
- Support physical, digital, service-based, and subscription commerce models.
- Coordinate with Payments for charges and refunds.
- Coordinate with Escrow for held funds and conditional release.
- Coordinate with Marketplace Engine for multi-party transactions, commissions, and seller operations.
- Emit commerce events for reporting, notifications, risk, and AI-driven recommendations.

#### Public APIs

- `POST /v1/commerce/catalogs`
- `POST /v1/commerce/products`
- `PATCH /v1/commerce/products/{product_id}`
- `POST /v1/commerce/carts`
- `PATCH /v1/commerce/carts/{cart_id}`
- `POST /v1/commerce/checkout-sessions`
- `POST /v1/commerce/orders`
- `GET /v1/commerce/orders/{order_id}`
- `PATCH /v1/commerce/orders/{order_id}`
- `POST /v1/commerce/refunds`

#### Dependencies

- Identity for buyers, sellers, and operators.
- Workspace for tenant catalog ownership.
- Payments for payment processing and refunds.
- Escrow for conditional payment holds.
- Marketplace Engine for seller and listing workflows.
- Risk Engine for order and buyer or seller risk.
- Notifications for order lifecycle communications.
- Reporting for commerce analytics.

#### Future extensions

- Multi-vendor checkout.
- Configurable fulfillment workflows.
- AI-assisted pricing, merchandising, and recommendations.
- Subscription bundles across Atlas products.
- Global commerce localization and compliance.

### Escrow

#### Purpose

Escrow manages conditional funds holding, release, dispute, refund, and payout workflows for trust-sensitive transactions.

#### Responsibilities

- Create escrow agreements tied to orders, marketplace transactions, service milestones, tips, salary protections, or future product workflows.
- Hold funds until release conditions are met.
- Support milestone releases, buyer approval, seller proof, automated release rules, and dispute outcomes.
- Coordinate with Payments for authorization, capture, refund, payout, and ledger updates.
- Use Risk Engine decisions to hold, delay, review, or release funds.
- Maintain auditable escrow state transitions and evidence packages.

#### Public APIs

- `POST /v1/escrow/accounts`
- `POST /v1/escrow/agreements`
- `GET /v1/escrow/agreements/{agreement_id}`
- `POST /v1/escrow/agreements/{agreement_id}/fund`
- `POST /v1/escrow/agreements/{agreement_id}/release`
- `POST /v1/escrow/agreements/{agreement_id}/refund`
- `POST /v1/escrow/agreements/{agreement_id}/disputes`
- `PATCH /v1/escrow/disputes/{dispute_id}`

#### Dependencies

- Payments for money movement and ledger reconciliation.
- Commerce Engine for orders and checkout context.
- Marketplace Engine for buyer, seller, listing, and transaction context.
- Identity and Workspace for parties and authorization.
- Risk Engine for hold and release decisioning.
- Notifications for escrow lifecycle updates.
- Reporting for escrow balances, disputes, and settlement analytics.

#### Future extensions

- Programmable escrow rules for enterprise customers.
- Milestone-based escrow for services and labor products.
- AI-assisted dispute evidence review.
- Cross-border escrow support where legally supported.
- Escrow-backed trust guarantees for marketplace products.

### Marketplace Engine

#### Purpose

Marketplace Engine provides the shared infrastructure for multi-party ecosystems where buyers, sellers, providers, workers, merchants, or businesses discover, transact, review, and build trust.

#### Responsibilities

- Manage sellers, buyers, listings, availability, offers, requests, reviews, ratings, commissions, disputes, and marketplace policies.
- Support discovery, search indexing, ranking signals, trust badges, and reputation models.
- Coordinate marketplace orders through Commerce Engine.
- Coordinate payments, fee splitting, escrow, and payouts through Payments and Escrow.
- Use Risk Engine and Provider Engine evidence to evaluate trust and safety.
- Provide reusable marketplace primitives for Trust Marketplace, Tipit, Atlas Commerce, SalaryGuard, and future products.

#### Public APIs

- `POST /v1/marketplace/participants`
- `PATCH /v1/marketplace/participants/{participant_id}`
- `POST /v1/marketplace/listings`
- `PATCH /v1/marketplace/listings/{listing_id}`
- `GET /v1/marketplace/listings/search`
- `POST /v1/marketplace/offers`
- `POST /v1/marketplace/reviews`
- `GET /v1/marketplace/reputation/{participant_id}`
- `POST /v1/marketplace/disputes`

#### Dependencies

- Identity for participants and organizations.
- Workspace for marketplace ownership and tenant configuration.
- Commerce Engine for catalog, checkout, order, and fulfillment workflows.
- Payments for commissions, payouts, and refunds.
- Escrow for conditional transaction settlement.
- Risk Engine for trust, fraud, moderation, and safety decisions.
- AI Engine for ranking, content moderation, recommendations, and support automation.
- Reporting for marketplace liquidity, conversion, quality, and trust metrics.

#### Future extensions

- Cross-product reputation graph.
- Marketplace policy engine with versioned enforcement.
- AI-assisted matching between supply and demand.
- Verified provider network.
- Portable trust credentials across Atlas-powered marketplaces.

## Product Architecture

Atlas products are product experiences built on shared platform services. Each product owns its user experience, product-specific workflows, packaging, and domain-specific data, but it should consume Atlas APIs for common capabilities. A product should only create product-specific logic when the logic is truly unique to that product. If a capability can benefit multiple products, it belongs in Atlas.

Products consume Atlas through the API Gateway, product SDKs, internal service APIs, shared event streams, and reporting datasets. Atlas services expose stable public contracts and versioned schemas so products can evolve independently without breaking each other.

### ShadowScore

ShadowScore is the first commercial product on Atlas. It uses Atlas to evaluate trust, risk, reputation, and provider evidence for individuals, businesses, or digital entities.

- Identity stores subjects, organizations, and account relationships.
- Provider Engine gathers third-party evidence and verification data.
- Risk Engine converts signals into scores, decisions, reason codes, and review workflows.
- AI Engine summarizes evidence, classifies risk patterns, and supports analyst workflows.
- Reporting provides score trends, provider quality, conversion impact, and decision analytics.
- Notifications sends score updates, verification requests, review outcomes, and customer alerts.
- API Gateway exposes ShadowScore APIs to customers and partners.

ShadowScore should harden Atlas risk, provider, reporting, monitoring, and API patterns for every future product.

### Tipit

Tipit is a tipping and creator or service-worker payment product. It should not build standalone identity, payments, notifications, risk, or reporting systems.

- Identity manages tippers, recipients, merchants, and organizations.
- Workspace groups teams, venues, creator accounts, or business locations.
- Payments processes tips, fees, refunds, payouts, and tax-relevant records.
- Risk Engine evaluates payment abuse, recipient risk, account takeovers, and payout holds.
- Notifications sends receipts, payout updates, and account alerts.
- Reporting provides revenue, payout, location, recipient, and campaign analytics.
- Escrow may support conditional tips, pooled tips, or delayed release workflows.

Tipit should strengthen Atlas payment, payout, workspace, and lightweight commerce capabilities.

### SalaryGuard

SalaryGuard protects workers, employers, or contractors from compensation risk and employment-related trust failures.

- Identity models workers, employers, contractors, payroll contacts, and organizations.
- Workspace manages employer accounts, teams, and employee or contractor access.
- Provider Engine integrates payroll, HR, banking, employment, or verification providers.
- Risk Engine evaluates salary reliability, employer risk, worker verification, and dispute likelihood.
- Escrow can support protected compensation flows, milestone-based payment, or guarantee workflows.
- AI Engine extracts and analyzes contracts, pay records, dispute evidence, and policy documents.
- Reporting provides salary risk trends, claim outcomes, employer reliability, and operational metrics.

SalaryGuard should strengthen Atlas evidence models, escrow primitives, provider integrations, and AI-assisted document workflows.

### Trust Marketplace

Trust Marketplace connects verified providers, buyers, sellers, and service participants using Atlas trust infrastructure.

- Marketplace Engine manages participants, listings, search, reviews, reputation, offers, and disputes.
- Commerce Engine manages checkout, orders, fulfillment, discounts, and refunds.
- Payments manages charges, marketplace fees, payout splitting, and reconciliation.
- Escrow manages conditional release for high-trust transactions.
- Risk Engine evaluates participant, listing, transaction, review, and payout risk.
- Provider Engine verifies credentials, certifications, background signals, or business evidence.
- AI Engine powers matching, moderation, recommendations, support, and evidence summarization.

Trust Marketplace should strengthen Atlas marketplace, escrow, commerce, and cross-product reputation capabilities.

### Atlas Commerce

Atlas Commerce is the platform-native commerce product built directly on Commerce Engine and the broader Atlas service suite.

- Commerce Engine provides catalog, checkout, order, refund, and fulfillment primitives.
- Payments provides billing, subscriptions, charges, refunds, taxes, and reconciliation.
- Marketplace Engine supports multi-seller commerce when needed.
- Escrow supports protected commerce and trust guarantees.
- Risk Engine protects against fraud, chargebacks, seller abuse, and fulfillment risk.
- AI Engine supports merchandising, customer support, product content generation, and recommendations.
- Reporting provides sales, margin, conversion, cohort, inventory, and operational analytics.

Atlas Commerce should validate Atlas as a reusable commercial operating system, not just a support layer for trust products.

### Future AI products

Future AI products should be built on Atlas rather than creating isolated AI stacks.

- AI Engine provides shared agent, model, prompt, retrieval, evaluation, and safety infrastructure.
- Provider Engine handles model routing, cost control, reliability, and provider abstraction.
- Identity, Authentication, and Workspace provide secure customer and tenant boundaries.
- Reporting tracks usage, quality, cost, outcomes, and customer value.
- Risk Engine evaluates safety, abuse, fraud, and trust implications.
- API Gateway exposes stable product and partner APIs.

Future AI products should expand Atlas intelligence, automation, evaluation, and evidence-driven decisioning for all products.

## Engineering Principles

### Reusable modules

Atlas capabilities must be reusable by default. If a feature appears in more than one product, it should become a platform module, shared service, library, event schema, policy, or API.

### No duplicated logic

Products should not duplicate identity, authentication, workspace, payment, notification, provider, risk, AI, reporting, monitoring, commerce, escrow, or marketplace logic. Product-specific services may orchestrate Atlas modules, but the source of truth should remain in Atlas.

### Everything API-first

Every Atlas capability should be accessible through clear APIs before it is embedded in a product UI. APIs must be documented, testable, versioned, observable, and designed for internal and future external consumers.

### Everything versioned

APIs, events, data schemas, risk policies, AI prompts, models, provider contracts, reporting definitions, and workflow states must be versioned. Versioning allows Atlas to support multiple products without unsafe breaking changes.

### Evidence-driven architecture

Architectural decisions should be guided by evidence: product reuse, operational data, customer demand, incident history, provider quality, risk outcomes, revenue impact, and engineering cost. Atlas should avoid speculative complexity, but it should deliberately promote proven cross-product capabilities into the platform.

### Security-first

Security is a platform property, not a product add-on. Atlas must enforce least privilege, strong authentication, tenant isolation, encryption, audit trails, secure defaults, dependency hygiene, privacy controls, and incident response readiness across every module.

### Provider-based intelligence

Atlas should treat external providers as interchangeable, measurable, and governable sources of intelligence or execution. Provider-based architecture allows Atlas to improve accuracy, lower cost, increase resilience, and expand internationally without rewriting product logic.

### Scalable for future products

Atlas must be designed for products that do not exist yet. Services should expose general primitives, composable workflows, stable contracts, and shared data models that can support new commercial, AI, marketplace, trust, commerce, and financial experiences.

## Long-Term Goal

Atlas should become the operating platform for digital business.

ShadowScore is only the first product built on Atlas. The purpose of Atlas is to compound infrastructure, intelligence, trust, commerce, and operational capabilities across every product in the portfolio.

Every product must strengthen Atlas, and every improvement to Atlas must benefit all products. Over time, Atlas should make each new product faster to launch, safer to operate, easier to scale, and more valuable because it inherits the accumulated capabilities of the entire platform.

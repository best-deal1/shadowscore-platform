# ShadowScore V23 Provider Framework

## Purpose

The Provider Framework is the modular intelligence layer behind ShadowScore. It replaces inline placeholder execution with independent provider modules that can later be connected to production data sources without changing the Risk Engine or report pipeline contract.

The framework follows the V19 product principle that reports must be evidence-driven, versioned, and reproducible. Provider results are stored as structured snapshots with provider versions, evidence, metadata, timestamps, durations, and execution errors.

## Architecture

Provider code lives under `lib/providers/`.

- `types.ts` defines the stable provider contracts used by ShadowScore and future Atlas services.
- `BaseProvider.ts` supplies shared execution behavior, timing, result envelopes, error capture, and health checks.
- `ProviderManager.ts` owns registration and execution orchestration.
- `placeholderProviders.ts` registers placeholder-only provider modules.
- `WHOISProvider.ts` owns the production WHOIS/RDAP implementation.
- `defaultProviders.ts` composes placeholders with production providers for ProviderManager registration.
- `index.ts` exposes the reusable public Provider Framework API.

The Risk Engine receives `ProviderResult[]` and does not know how providers collect evidence internally. This keeps provider implementation details isolated from scoring and report generation.

## Provider interface

Every provider must expose:

- `id`
- `name`
- `version`
- `category`
- `execute(context)`
- `health()`

Every `execute()` call returns a `ProviderResult` containing:

- `providerId`
- `providerVersion`
- `status`
- `startedAt`
- `completedAt`
- `duration`
- `findings`
- `evidence`
- `metadata`
- `errors`

## Provider lifecycle

1. The report pipeline builds a `ProviderExecutionContext` from paid intake and payment data.
2. `ProviderManager` executes registered providers.
3. Each provider returns a versioned `ProviderResult` snapshot.
4. The report pipeline stores provider versions and complete provider results on the generated report.
5. The Risk Engine receives the collected `ProviderResult[]` as input and remains decoupled from provider internals.

## Registration

V23 registers the default providers through `createDefaultProviders()` and `ProviderManager.registerMany()`.

The default provider set is:

- `SSLProvider`
- `DNSProvider`
- `WHOISProvider` (production RDAP implementation)
- `SecurityHeadersProvider`
- `SPFProvider`
- `DMARCProvider`
- `DKIMProvider`
- `RobotsTxtProvider`
- `SecurityTxtProvider`
- `ReputationProvider`
- `BusinessProfileProvider`
- `MarketplaceProvider`
- `PaymentProvider`
- `ComplianceProvider`

The manager rejects duplicate provider IDs so report snapshots keep a stable provider-version map.

## Execution

V23 runs providers sequentially while returning a `ProviderResult[]` contract that can support future parallel execution. Sequential execution is intentional for the architecture-only phase because no real API integrations are connected yet.

Future parallel execution can be added inside `ProviderManager.runProviders()` without changing callers because the public return type remains `Promise<ProviderResult[]>`.

## Placeholder provider rules

Placeholder providers do not perform network calls, API lookups, scoring, or production intelligence. They return structured placeholder findings and evidence only:

- `metadata.lookupPerformed` is `false`.
- `metadata.integrationStatus` is `not_connected`.
- Findings use informational severity.
- Evidence identifies the target and placeholder source.

This preserves the architecture while avoiding fake scores, fake intelligence, demo reports, or unverified claims.

## WHOIS production implementation

The active WHOIS path is `ProviderManager` → `WHOISProvider.ts` → `Risk Engine`. `WHOISProvider.ts` performs RDAP lookups, returns observable domain evidence, and exposes WHOIS findings to the Risk Engine through the standard `ProviderResult[]` contract. No production WHOIS logic belongs in `placeholderProviders.ts`.

## Future provider implementation

To add a production provider:

1. Create a provider class that extends `BaseProvider` or implements `Provider` directly.
2. Keep a stable `id` and increment `version` whenever result semantics change.
3. Implement `collect()` or `execute()` to gather evidence and findings.
4. Return observable evidence and provider metadata; do not return unexplained scores.
5. Register the provider through the default provider factory or a future dependency-injected registry.
6. Add provider-specific tests and health metadata before enabling production execution.

Provider implementations should keep platform-specific logic inside the provider module. For example, marketplace notice codes belong in marketplace providers, not in the core Risk Engine.

## Integration with Risk Engine

`lib/reportPipeline.ts` now executes the Provider Framework and passes `ProviderResult[]` into `analyzeRisk()`.

`lib/riskEngine.ts` accepts provider results as context. The engine can reason over provider result availability while remaining independent from provider implementation details.

Reports store:

- `engineVersion`
- `providerVersions`
- `providerResults`
- `evidenceSummary`
- `reportSummary`

This makes generated reports compatible with Atlas-style versioned services and future reproducibility requirements.

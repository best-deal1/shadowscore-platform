import { buildInvestigationGraph } from "../investigationEngine";
import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import { GoogleDnsInvestigationProvider } from "./dnsProvider";
import type { CollectionSeed, InvestigationCollectionOptions, InvestigationProvider, LiveInvestigation, LiveInvestigationAudience, ProviderRun } from "./types";
import { isPublicMailboxDomain } from "../emailDomains";
import { BravePublicWebInvestigationProvider } from "./publicWebProvider";
import { PROVIDER_CAPABILITY_REGISTRY } from "./capabilityRegistry";
import { SecEdgarCompanyRegistryProvider } from "./secEdgarProvider";
import { BraveBusinessWebInvestigationProvider } from "./businessWebProvider";

const key = (seed: CollectionSeed) => `${seed.kind}:${seed.value.trim().toLowerCase()}`;
const unavailableMarketplaceProvider = (): InvestigationProvider => ({
  manifest: { id: "marketplace-partner", name: "Marketplace partner intelligence", supportedSeedTypes: ["email", "phone", "company", "domain", "marketplace_identity"], supportedJurisdictions: ["global"], supportedMarketplaces: ["amazon", "ebay", "etsy", "shopify", "tiktok-shop"], availability: { status: "unavailable", reason: "The credentialed marketplace partner client is not configured." }, authentication: "api_key", rateLimit: "Defined by marketplace partner contract", cost: null, evidenceTypes: ["marketplace"], sourceFamily: "marketplace-partner", legalBasis: "licensed", capabilities: ["marketplace"] },
  async collect() { throw new Error("Marketplace partner credentials are unavailable."); },
});
const unavailableRegisteredProvider = (registration: (typeof PROVIDER_CAPABILITY_REGISTRY)[number]): InvestigationProvider => ({
  manifest: { id: registration.id, name: registration.id.replace(/-/g, " "), supportedSeedTypes: registration.targetTypes, supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: { status: "unavailable", reason: `The authorized ${registration.id} API client is not configured.` }, authentication: registration.credentialEnv ? "api_key" : "none", rateLimit: "Defined by provider contract", cost: null, evidenceTypes: ["other"], sourceFamily: registration.id, legalBasis: registration.legalBasis, capabilities: [registration.capability] },
  async collect() { throw new Error(`The authorized ${registration.id} API client is not configured.`); },
});
export function createLiveInvestigationProviders(): InvestigationProvider[] {
  const implemented = new Set(["public-social-discovery", "marketplace-partner", "sec-edgar-company-registry"]);
  return [new GoogleDnsInvestigationProvider(), new BravePublicWebInvestigationProvider(), new BraveBusinessWebInvestigationProvider(), new SecEdgarCompanyRegistryProvider(), unavailableMarketplaceProvider(), ...PROVIDER_CAPABILITY_REGISTRY.filter((item) => !implemented.has(item.id)).map(unavailableRegisteredProvider)];
}

/** Customer output retains reviewable provenance and gaps, while exact queries and errors remain administrative. */
export function presentLiveInvestigation(investigation: LiveInvestigation, audience: LiveInvestigationAudience = "customer"): LiveInvestigation {
  if (audience === "administrator") return structuredClone(investigation);
  const customer = structuredClone(investigation);
  for (const run of customer.providerRuns) {
    delete run.query;
    delete run.error;
  }
  for (const item of customer.graph.evidence) {
    delete item.source.query;
    if (item.source.normalization) delete item.source.normalization.raw;
    if (item.discovery) delete item.discovery.query;
  }
  return customer;
}

export async function investigateLive(seed: CollectionSeed, options: InvestigationCollectionOptions = {}): Promise<LiveInvestigation> {
  if (!seed.value.trim()) throw new Error("Investigation seed value is required.");
  const providers = options.providers || createLiveInvestigationProviders();
  const submittedDomain = seed.kind === "email" ? seed.value.split("@").at(-1)?.toLowerCase() : seed.kind === "domain" ? seed.value.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] : "";
  const israeliBusinessTarget = Boolean(submittedDomain?.endsWith(".il")) || (seed.kind === "registration_number" && /^\d{9}$/.test(seed.value.trim()));
  const maxDepth = options.maxDepth ?? 2, maxProviderCalls = options.maxProviderCalls ?? 12, timeoutMs = options.timeoutMs ?? 5_000, maxRetries = options.maxRetries ?? 1, budgetUsd = options.budgetUsd ?? 0.25;
  const now = options.now || (() => new Date());
  const queue: { seed: CollectionSeed; depth: number }[] = [{ seed, depth: 0 }], seen = new Set<string>(), scheduled = new Set([key(seed)]);
  const candidates = new Map<string, EntityCandidate>(), evidence = new Map<string, EvidenceAssertion>(), providerRuns: ProviderRun[] = [], discoveredSeeds: CollectionSeed[] = [];
  let calls = 0, spentUsd = 0;
  while (queue.length && calls < maxProviderCalls) {
    const current = queue.shift()!; seen.add(key(current.seed));
    for (const provider of providers.filter((item) => item.manifest.supportedSeedTypes.includes(current.seed.kind))) {
      if (calls >= maxProviderCalls) break;
      if (provider.manifest.availability.status === "unavailable") { providerRuns.push({ providerId: provider.manifest.id, seed: current.seed, depth: current.depth, configuration: "unavailable", status: "unavailable", attempts: 0, evidenceCount: 0, error: provider.manifest.availability.reason, query: current.seed.value }); continue; }
      if (israeliBusinessTarget && provider.manifest.id === "sec-edgar-company-registry") { providerRuns.push({ providerId: provider.manifest.id, seed: current.seed, depth: current.depth, configuration: "configured", status: "not_applicable", attempts: 0, evidenceCount: 0, error: "SEC EDGAR covers U.S. public issuers, not Israeli private-company registrations.", query: current.seed.value }); continue; }
      if (current.seed.kind === "email" && provider.manifest.capabilities?.includes("business") && isPublicMailboxDomain(current.seed.value.split("@").at(-1) || "")) continue;
      const cost = provider.manifest.cost?.amount || 0;
      if (spentUsd + cost > budgetUsd) { providerRuns.push({ providerId: provider.manifest.id, seed: current.seed, depth: current.depth, configuration: "configured", status: "budget_blocked", attempts: 0, evidenceCount: 0, query: current.seed.value }); continue; }
      let attempts = 0, result, error: unknown, timedOut = false;
      while (attempts <= maxRetries && !result && calls < maxProviderCalls) {
        attempts += 1; calls += 1; const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
        try { result = await provider.collect(current.seed, { signal: controller.signal, now: now().toISOString(), depth: current.depth }); }
        catch (caught) { error = caught; timedOut = controller.signal.aborted; }
        finally { clearTimeout(timer); }
      }
      if (!result) { const message = error instanceof Error ? error.message : String(error); providerRuns.push({ providerId: provider.manifest.id, seed: current.seed, depth: current.depth, configuration: "configured", status: timedOut ? "timed_out" : "failed", attempts, evidenceCount: 0, error: message, query: current.seed.value }); options.logger?.warn("investigation_provider_failed", { providerId: provider.manifest.id, seedKind: current.seed.kind, attempts, error: message }); continue; }
      spentUsd += cost; providerRuns.push({ providerId: provider.manifest.id, seed: current.seed, depth: current.depth, configuration: "configured", status: result.evidence.length ? "success" : "empty", attempts, evidenceCount: result.evidence.length, query: current.seed.value });
      for (const item of result.candidates) { const existing = candidates.get(item.candidateId); candidates.set(item.candidateId, existing ? { ...existing, identifiers: [...existing.identifiers, ...item.identifiers], evidenceIds: [...new Set([...existing.evidenceIds, ...item.evidenceIds])] } : item); }
      for (const item of result.evidence) evidence.set(item.evidenceId, { ...item, source: { ...item.source, sourceFamily: item.source.sourceFamily || provider.manifest.sourceFamily, license: item.source.license || provider.manifest.legalBasis }, lifecycle: item.lifecycle || "observed", confidenceComponents: item.confidenceComponents || { identifierMatch: item.confidence, sourceReliability: item.source.reliability, independence: 100, freshness: 100, hopDecay: current.depth * 10 } });
      for (const next of result.discoveredSeeds) if (current.depth < maxDepth && !seen.has(key(next)) && !scheduled.has(key(next))) { scheduled.add(key(next)); discoveredSeeds.push(next); queue.push({ seed: next, depth: current.depth + 1 }); }
    }
  }
  const authoritativeRuns = providerRuns.filter((run) => providers.find((provider) => provider.manifest.id === run.providerId)?.manifest.capabilities?.includes("registry"));
  const registryGap = israeliBusinessTarget
    ? ["Authoritative Israeli company-registry coverage is not configured. SEC EDGAR covers U.S. public issuers and does not verify Israeli private entities. Government, municipal, and first-party records remain supporting evidence only."]
    : authoritativeRuns.length && authoritativeRuns.every((run) => run.status !== "success")
    ? [`Authoritative registry coverage is unavailable (${authoritativeRuns.map((run) => `${run.providerId}: ${run.status}`).join(", ")}).`]
    : [];
  const graph = buildInvestigationGraph({ seed, candidates: [...candidates.values()], evidence: [...evidence.values()], coverageGaps: registryGap, now: now().toISOString(), logger: options.logger });
  options.logger?.info("live_investigation_completed", { seedKind: seed.kind, providerCalls: calls, evidence: evidence.size, discoveredSeeds: discoveredSeeds.length, decision: graph.decision.outcome });
  return { graph, providerRuns, discoveredSeeds, spentUsd, limits: { maxDepth, maxProviderCalls, timeoutMs, budgetUsd } };
}

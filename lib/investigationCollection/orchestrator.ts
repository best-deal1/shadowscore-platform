import { buildInvestigationGraph } from "../investigationEngine";
import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import { GoogleDnsInvestigationProvider } from "./dnsProvider";
import type { CollectionSeed, InvestigationCollectionOptions, InvestigationProvider, LiveInvestigation, ProviderRun } from "./types";

const key = (seed: CollectionSeed) => `${seed.kind}:${seed.value.trim().toLowerCase()}`;
const unavailableMarketplaceProvider = (): InvestigationProvider => ({
  manifest: { id: "marketplace-partner", name: "Marketplace partner intelligence", supportedSeedTypes: ["email", "phone", "company", "domain", "marketplace_identity"], supportedJurisdictions: ["global"], supportedMarketplaces: ["amazon", "ebay", "etsy", "shopify", "tiktok-shop"], availability: { status: "unavailable", reason: "The credentialed marketplace partner client is not configured." }, authentication: "api_key", rateLimit: "Defined by marketplace partner contract", cost: null, evidenceTypes: ["marketplace"] },
  async collect() { throw new Error("Marketplace partner credentials are unavailable."); },
});
export function createLiveInvestigationProviders(): InvestigationProvider[] { return [new GoogleDnsInvestigationProvider(), unavailableMarketplaceProvider()]; }

export async function investigateLive(seed: CollectionSeed, options: InvestigationCollectionOptions = {}): Promise<LiveInvestigation> {
  if (!seed.value.trim()) throw new Error("Investigation seed value is required.");
  const providers = options.providers || createLiveInvestigationProviders();
  const maxDepth = options.maxDepth ?? 2, maxProviderCalls = options.maxProviderCalls ?? 12, timeoutMs = options.timeoutMs ?? 5_000, maxRetries = options.maxRetries ?? 1, budgetUsd = options.budgetUsd ?? 0.25;
  const now = options.now || (() => new Date());
  const queue: { seed: CollectionSeed; depth: number }[] = [{ seed, depth: 0 }], seen = new Set<string>(), scheduled = new Set([key(seed)]);
  const candidates = new Map<string, EntityCandidate>(), evidence = new Map<string, EvidenceAssertion>(), providerRuns: ProviderRun[] = [], discoveredSeeds: CollectionSeed[] = [];
  let calls = 0, spentUsd = 0;
  while (queue.length && calls < maxProviderCalls) {
    const current = queue.shift()!; seen.add(key(current.seed));
    for (const provider of providers.filter((item) => item.manifest.supportedSeedTypes.includes(current.seed.kind))) {
      if (calls >= maxProviderCalls) break;
      if (provider.manifest.availability.status === "unavailable") { const run = { providerId: provider.manifest.id, seed: current.seed, depth: current.depth, status: "unavailable", attempts: 0, evidenceCount: 0, error: provider.manifest.availability.reason } as const; providerRuns.push(run); await options.onProgress?.({ run, candidates: [], evidence: [] }); continue; }
      const cost = provider.manifest.cost?.amount || 0;
      if (spentUsd + cost > budgetUsd) { const run = { providerId: provider.manifest.id, seed: current.seed, depth: current.depth, status: "budget_blocked", attempts: 0, evidenceCount: 0 } as const; providerRuns.push(run); await options.onProgress?.({ run, candidates: [], evidence: [] }); continue; }
      let attempts = 0, result, error: unknown, timedOut = false;
      while (attempts <= maxRetries && !result && calls < maxProviderCalls) {
        attempts += 1; calls += 1; const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
        try { result = await provider.collect(current.seed, { signal: controller.signal, now: now().toISOString(), depth: current.depth }); }
        catch (caught) { error = caught; timedOut = controller.signal.aborted; }
        finally { clearTimeout(timer); }
      }
      if (!result) { const message = error instanceof Error ? error.message : String(error); const run: ProviderRun = { providerId: provider.manifest.id, seed: current.seed, depth: current.depth, status: timedOut ? "timed_out" : "failed", attempts, evidenceCount: 0, error: message }; providerRuns.push(run); await options.onProgress?.({ run, candidates: [], evidence: [] }); options.logger?.warn("investigation_provider_failed", { providerId: provider.manifest.id, seedKind: current.seed.kind, attempts, error: message }); continue; }
      spentUsd += cost; const run: ProviderRun = { providerId: provider.manifest.id, seed: current.seed, depth: current.depth, status: "completed", attempts, evidenceCount: result.evidence.length }; providerRuns.push(run);
      for (const item of result.candidates) { const existing = candidates.get(item.candidateId); candidates.set(item.candidateId, existing ? { ...existing, identifiers: [...existing.identifiers, ...item.identifiers], evidenceIds: [...new Set([...existing.evidenceIds, ...item.evidenceIds])] } : item); }
      for (const item of result.evidence) evidence.set(item.evidenceId, item);
      await options.onProgress?.({ run, candidates: result.candidates, evidence: result.evidence });
      for (const next of result.discoveredSeeds) if (current.depth < maxDepth && !seen.has(key(next)) && !scheduled.has(key(next))) { scheduled.add(key(next)); discoveredSeeds.push(next); queue.push({ seed: next, depth: current.depth + 1 }); }
    }
  }
  const graph = buildInvestigationGraph({ seed, candidates: [...candidates.values()], evidence: [...evidence.values()], now: now().toISOString(), logger: options.logger });
  options.logger?.info("live_investigation_completed", { seedKind: seed.kind, providerCalls: calls, evidence: evidence.size, discoveredSeeds: discoveredSeeds.length, decision: graph.decision.outcome });
  return { graph, providerRuns, discoveredSeeds, spentUsd, limits: { maxDepth, maxProviderCalls, timeoutMs, budgetUsd } };
}

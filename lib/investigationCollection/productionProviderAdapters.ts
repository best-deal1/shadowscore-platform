import { createHash } from "node:crypto";
import { createDefaultProviders } from "../providers";
import type { Provider, ProviderCategory, ProviderEvidence } from "../providers/types";
import type { EvidenceAssertion, InvestigationInputKind } from "../investigationEngine/types";
import type { CollectionSeed, InvestigationProvider } from "./types";

const DOMAIN_CATEGORIES = new Set<ProviderCategory>(["dns", "whois", "ssl", "security_headers", "email_authentication", "reputation", "business_profile", "compliance"]);
const sourceUrl = (source: string) => /^https?:\/\//i.test(source) ? source : undefined;
const idFor = (providerId: string, seed: CollectionSeed, evidence: ProviderEvidence) => createHash("sha256").update(`${providerId}:${seed.kind}:${seed.value.toLowerCase()}:${evidence.id}:${evidence.value || ""}`).digest("hex").slice(0, 32);
const evidenceType = (category: ProviderCategory): EvidenceAssertion["evidenceType"] => category === "business_profile" || category === "compliance" ? "registry" : category === "marketplace" ? "marketplace" : "website";

function supports(provider: Provider): InvestigationInputKind[] {
  if (provider.category === "marketplace") return ["marketplace_identity", "company", "domain"];
  return DOMAIN_CATEGORIES.has(provider.category) ? ["domain"] : [];
}

export function adaptProductionProvider(provider: Provider): InvestigationProvider | undefined {
  const supportedSeedTypes = supports(provider);
  if (!supportedSeedTypes.length) return undefined;
  return {
    manifest: { id: `production-${provider.id}`, name: provider.name, supportedSeedTypes, supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "none", rateLimit: "Managed by the production provider", cost: null, evidenceTypes: [evidenceType(provider.category)] },
    async collect(seed, context) {
      if (context.signal.aborted) throw new DOMException("Provider timed out.", "AbortError");
      const target = seed.value.trim().toLowerCase();
      const candidateId = `${seed.kind}:${target}`;
      const result = await provider.execute({ intakeId: "canonical-live", investigationId: "canonical-live", scanMode: seed.kind === "marketplace_identity" ? "marketplace" : "website", target, canonicalTarget: target, platform: "Website", fileNames: [], visibleSignalCategories: [], executionProfile: "paid_report" });
      if (result.status !== "completed") throw new Error(result.errors[0] || `${provider.name} is unavailable.`);
      const evidence = result.evidence.filter((item) => item.type !== "placeholder").map((item) => ({ evidenceId: idFor(provider.id, seed, item), subjectCandidateId: candidateId, relationship: item.label || "observed", value: item.value || item.label, confidence: Math.round(provider.confidence(result) * (provider.confidence(result) <= 1 ? 100 : 1)), evidenceType: evidenceType(provider.category), source: { sourceId: provider.id, sourceName: item.source || provider.name, sourceUrl: sourceUrl(item.source), observedAt: item.collectedAt || result.completedAt, retrievedAt: result.completedAt, reliability: item.authoritative ? 95 : 75 } } satisfies EvidenceAssertion));
      return { candidates: [{ candidateId, kind: seed.kind === "domain" ? "domain" : seed.kind === "marketplace_identity" ? "marketplace_account" : "company", label: target, identifiers: [{ kind: seed.kind, value: target }], evidenceIds: evidence.map((item) => item.evidenceId) }], evidence, discoveredSeeds: [] };
    },
  };
}

export function createCanonicalPaidProviders(): InvestigationProvider[] {
  const production = createDefaultProviders().map(adaptProductionProvider).filter((provider): provider is InvestigationProvider => Boolean(provider));
  return [...production, {
    manifest: { id: "marketplace-partner", name: "Marketplace partner intelligence", supportedSeedTypes: ["marketplace_identity", "company", "domain"], supportedJurisdictions: ["global"], supportedMarketplaces: ["amazon", "ebay", "etsy", "shopify", "tiktok-shop"], availability: { status: "unavailable", reason: "The credentialed marketplace partner client is not configured." }, authentication: "api_key", rateLimit: "Defined by marketplace partner contract", cost: null, evidenceTypes: ["marketplace"] },
    async collect() { throw new Error("Marketplace partner credentials are unavailable."); },
  }];
}

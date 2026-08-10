import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import type { CollectionSeed, InvestigationProvider, InvestigationProviderManifest, ProviderCollectionContext } from "./types";

const ENDPOINT = "https://dns.google/resolve";
type DnsAnswer = { name?: string; type?: number; TTL?: number; data?: string };
type DnsResponse = { Status?: number; Answer?: DnsAnswer[] };

function domainFrom(seed: CollectionSeed) {
  const raw = seed.kind === "email" ? seed.value.split("@").at(-1) || "" : seed.value;
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0];
}

export class GoogleDnsInvestigationProvider implements InvestigationProvider {
  manifest: InvestigationProviderManifest = { id: "google-public-dns", name: "Google Public DNS", supportedSeedTypes: ["email", "domain"], supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "none", rateLimit: "Subject to Google Public DNS usage limits", cost: null, evidenceTypes: ["website"] };

  async collect(seed: CollectionSeed, context: ProviderCollectionContext) {
    const domain = domainFrom(seed);
    if (!domain || !domain.includes(".")) throw new Error("A valid domain is required for DNS collection.");
    const candidateId = `dns-domain:${domain}`;
    const candidates: EntityCandidate[] = [{ candidateId, kind: "domain", label: domain, identifiers: [{ kind: "domain", value: domain }], evidenceIds: [] }];
    const evidence: EvidenceAssertion[] = [];
    const retrievedAt = context.now;
    for (const type of ["A", "MX", "TXT"] as const) {
      const url = new URL(ENDPOINT); url.searchParams.set("name", domain); url.searchParams.set("type", type);
      const response = await fetch(url, { headers: { accept: "application/dns-json" }, signal: context.signal });
      if (!response.ok) throw new Error(`Google Public DNS returned HTTP ${response.status}.`);
      const payload = await response.json() as DnsResponse;
      for (const [index, answer] of (payload.Answer || []).entries()) {
        const value = String(answer.data || "").replace(/^"|"$/g, "");
        const evidenceId = `dns:${domain}:${type}:${index}`;
        candidates[0].evidenceIds.push(evidenceId);
        evidence.push({ evidenceId, subjectCandidateId: candidateId, relationship: `dns_${type.toLowerCase()}_record`, value, confidence: 92, evidenceType: "website", source: { sourceId: "google-public-dns", sourceName: "Google Public DNS", sourceUrl: url.toString(), retrievedAt, observedAt: retrievedAt, reliability: 90 } });
      }
    }
    return { candidates, evidence, discoveredSeeds: seed.kind === "email" ? [{ kind: "domain" as const, value: domain }] : [] };
  }
}

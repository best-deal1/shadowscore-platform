import type { EntityCandidate, EvidenceAssertion, InvestigationGraph, InvestigationInputKind } from "../investigationEngine/types";

export type CollectionSeed = { kind: InvestigationInputKind; value: string };
export type ProviderAvailability = { status: "available" | "unavailable"; reason?: string };
export type InvestigationProviderManifest = {
  id: string;
  name: string;
  supportedSeedTypes: InvestigationInputKind[];
  supportedJurisdictions: string[];
  supportedMarketplaces: string[];
  availability: ProviderAvailability;
  authentication: "none" | "api_key";
  rateLimit: string;
  cost: { amount: number; currency: "USD" } | null;
  evidenceTypes: EvidenceAssertion["evidenceType"][];
};
export type CollectionResult = { candidates: EntityCandidate[]; evidence: EvidenceAssertion[]; discoveredSeeds: CollectionSeed[] };
export type ProviderCollectionContext = { signal: AbortSignal; now: string; depth: number };
export interface InvestigationProvider { manifest: InvestigationProviderManifest; collect(seed: CollectionSeed, context: ProviderCollectionContext): Promise<CollectionResult> }
export type InvestigationCollectionOptions = {
  providers?: InvestigationProvider[];
  maxDepth?: number;
  maxProviderCalls?: number;
  timeoutMs?: number;
  maxRetries?: number;
  budgetUsd?: number;
  now?: () => Date;
  logger?: Pick<Console, "info" | "warn" | "error">;
};
export type ProviderRun = { providerId: string; seed: CollectionSeed; depth: number; status: "completed" | "failed" | "timed_out" | "unavailable" | "budget_blocked"; attempts: number; evidenceCount: number; error?: string };
export type LiveInvestigation = { graph: InvestigationGraph; providerRuns: ProviderRun[]; discoveredSeeds: CollectionSeed[]; spentUsd: number; limits: { maxDepth: number; maxProviderCalls: number; timeoutMs: number; budgetUsd: number } };

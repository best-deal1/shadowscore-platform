import type { ResolvedEntity } from "../../types";
import type { AuthoritativeIssuer, AuthoritativeRegistry } from "../types";
import { normalizeCIK } from "./client";
import type { SECResolutionCandidate, SECResolutionResult } from "./resolutionTypes";

export const SEC_AUTHORITATIVE_RESOLVER_VERSION = "sec-authoritative@1.0.0";

type MatchReason = SECResolutionCandidate["matchReason"];

export type SECAuthoritativeResolverOptions = {
  now?: () => string;
  resolverVersion?: string;
};

export class SECAuthoritativeResolver {
  private readonly registry: AuthoritativeRegistry;
  private readonly now: () => string;
  private readonly version: string;

  constructor(registry: AuthoritativeRegistry, options: SECAuthoritativeResolverOptions = {}) {
    this.registry = registry;
    this.now = options.now ?? (() => new Date().toISOString());
    this.version = options.resolverVersion ?? SEC_AUTHORITATIVE_RESOLVER_VERSION;
  }

  async resolve(entity: ResolvedEntity): Promise<SECResolutionResult> {
    const cik = inputValue(entity, "companyId");
    if (cik && isValidCIK(cik)) return this.resolveCIK(entity, cik);

    const ticker = inputValue(entity, "companyTicker");
    if (ticker) return this.resolveTicker(entity, ticker);

    const name = entity.canonicalName.trim() || entity.displayName.trim();
    if (!name) return this.failed("The entity does not contain an SEC identifier, ticker, or legal name.");
    return this.resolveName(entity, name);
  }

  private async resolveCIK(entity: ResolvedEntity, input: string): Promise<SECResolutionResult> {
    const cik = normalizeCIK(input);
    try {
      const issuer = await this.registry.resolveByCIK(cik);
      if (!issuer || normalizeIssuerCIK(issuer) !== cik || !issuer.legalName.trim()) {
        return this.failed(`No SEC issuer was confirmed for CIK ${cik}.`);
      }
      return this.authoritative(entity, issuer, "exact_cik", 1);
    } catch (error) {
      return this.upstreamFailure("CIK", error);
    }
  }

  private async resolveTicker(entity: ResolvedEntity, input: string): Promise<SECResolutionResult> {
    const ticker = input.trim().toUpperCase();
    try {
      const issuer = await this.registry.resolveByTicker(ticker);
      if (!issuer || !issuer.tickers.some((value) => value.trim().toUpperCase() === ticker)) {
        return this.failed(`No unique exact SEC issuer was confirmed for ticker ${ticker}.`);
      }
      return this.authoritative(entity, issuer, "exact_ticker", 1, ticker);
    } catch (error) {
      return this.upstreamFailure("ticker", error);
    }
  }

  private async resolveName(entity: ResolvedEntity, input: string): Promise<SECResolutionResult> {
    try {
      const matches = (await this.registry.resolveByName(input)).filter(
        (issuer) => normalizeLegalName(issuer.legalName) === normalizeLegalName(input),
      );
      if (matches.length === 0) return this.failed(`No exact SEC legal-name match was found for ${input}.`);
      if (matches.length > 1) {
        return {
          status: "AMBIGUOUS",
          confidence: 0,
          candidates: matches.map((issuer) => candidate(issuer, "exact_legal_name")),
          warnings: [`Multiple exact SEC legal-name matches were found for ${input}.`],
          resolver: "sec",
          resolverVersion: this.version,
        };
      }
      return this.authoritative(entity, matches[0], "exact_legal_name", 0.98);
    } catch (error) {
      return this.upstreamFailure("legal name", error);
    }
  }

  private authoritative(
    original: ResolvedEntity,
    issuer: AuthoritativeIssuer,
    reason: MatchReason,
    confidence: number,
    matchedTicker?: string,
  ): SECResolutionResult {
    const timestamp = this.now();
    const cik = normalizeIssuerCIK(issuer);
    const existingIdentifiers = asRecord(original.metadata.authoritativeIdentifiers);
    const ticker = matchedTicker ?? issuer.tickers[0];
    const entity: ResolvedEntity = {
      ...original,
      displayName: issuer.legalName,
      canonicalName: issuer.legalName,
      resolutionStatus: "AUTHORITATIVE",
      updatedAt: timestamp,
      resolverVersion: this.version,
      provenance: [
        ...original.provenance,
        {
          source: "authoritative",
          extractor: "sec-registry",
          confidence,
          timestamp,
          field: "canonicalName",
          value: issuer.legalName,
          metadata: { registry: "sec", cik, ticker, matchReason: reason },
        },
      ],
      metadata: {
        ...original.metadata,
        authoritativeIdentifiers: {
          ...existingIdentifiers,
          sec: {
            cik,
            legalName: issuer.legalName,
            tickers: [...issuer.tickers],
            exchanges: [...issuer.exchanges],
            sourceUrls: [...issuer.sourceUrls],
          },
        },
      },
    };
    return {
      status: "AUTHORITATIVE",
      entity,
      confidence,
      candidates: [candidate(issuer, reason, matchedTicker)],
      warnings: [],
      resolver: "sec",
      resolverVersion: this.version,
    };
  }

  private failed(warning: string): SECResolutionResult {
    return { status: "FAILED", confidence: 0, candidates: [], warnings: [warning], resolver: "sec", resolverVersion: this.version };
  }

  private upstreamFailure(lookup: string, error: unknown): SECResolutionResult {
    const message = error instanceof Error ? error.message : String(error);
    return this.failed(`SEC upstream failure during ${lookup} resolution: ${message}`);
  }
}

function inputValue(entity: ResolvedEntity, field: "companyId" | "companyTicker"): string | undefined {
  const provenance = [...entity.provenance].reverse().find((item) => item.field === field);
  if (provenance?.value.trim()) return provenance.value.trim();
  const originalInput = asRecord(entity.metadata.originalInput);
  const value = originalInput[field] ?? entity.metadata[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isValidCIK(value: string): boolean {
  return /^(?:CIK)?\d{1,10}$/i.test(value.trim());
}

function normalizeIssuerCIK(issuer: AuthoritativeIssuer): string {
  return normalizeCIK(issuer.registryId);
}

function normalizeLegalName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/[.,]/g, "").replace(/\s+/g, " ");
}

function candidate(issuer: AuthoritativeIssuer, matchReason: MatchReason, matchedTicker?: string): SECResolutionCandidate {
  const tickerIndex = matchedTicker
    ? issuer.tickers.findIndex((value) => value.toUpperCase() === matchedTicker.toUpperCase())
    : 0;
  const index = tickerIndex >= 0 ? tickerIndex : 0;
  return {
    cik: normalizeIssuerCIK(issuer),
    legalName: issuer.legalName,
    ...(issuer.tickers[index] ? { ticker: issuer.tickers[index] } : {}),
    ...(issuer.exchanges[index] ? { exchange: issuer.exchanges[index] } : {}),
    matchReason,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

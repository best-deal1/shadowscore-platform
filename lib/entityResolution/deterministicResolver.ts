import { createHash } from "node:crypto";
import type { EntityResolutionInput, EntityResolver, EntityType, ResolvedEntity } from "./types";

export const ENTITY_SCHEMA_VERSION = "entity@1.0.0";
export const DETERMINISTIC_RESOLVER_VERSION = "deterministic@1.0.0";

type Extraction = { entityType: EntityType; canonicalName: string; displayName: string; extractor: string; field: string };

function domainFrom(value: string): string | undefined {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const hostname = new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
    return hostname.includes(".") && !hostname.includes(" ") ? hostname : undefined;
  } catch {
    return undefined;
  }
}

function extract(input: EntityResolutionInput): Extraction {
  const target = input.target.trim();
  const email = (input.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) ? target : "")).trim().toLowerCase();
  if (email) return { entityType: "email", canonicalName: email, displayName: email, extractor: "email-parser", field: input.email ? "email" : "target" };

  const phone = target.replace(/[\s().-]/g, "");
  if (/^\+?[1-9]\d{6,14}$/.test(phone)) return { entityType: "phone", canonicalName: phone, displayName: target, extractor: "phone-parser", field: "target" };

  const domain = domainFrom(target);
  if (domain) return { entityType: "domain", canonicalName: domain, displayName: domain, extractor: "url-parser", field: "target" };

  const canonicalName = target.replace(/\s+/g, " ");
  return {
    entityType: input.companyId || input.companyTicker ? "company" : "organization",
    canonicalName,
    displayName: canonicalName,
    extractor: input.companyTicker ? "company-ticker" : input.companyId ? "company-id" : "name-normalizer",
    field: input.companyTicker ? "companyTicker" : input.companyId ? "companyId" : "target",
  };
}

function entityId(type: EntityType, canonicalName: string) {
  const digest = createHash("sha256").update(`${ENTITY_SCHEMA_VERSION}:${type}:${canonicalName}`).digest("hex").slice(0, 20);
  return `ent_${type}_${digest}`;
}

export class DeterministicEntityResolver implements EntityResolver {
  private readonly now: () => string;

  constructor(now: () => string = () => new Date().toISOString()) {
    this.now = now;
  }

  resolve(input: EntityResolutionInput): ResolvedEntity {
    const extraction = extract(input);
    const timestamp = this.now();
    return {
      entityId: entityId(extraction.entityType, extraction.canonicalName),
      entityType: extraction.entityType,
      displayName: extraction.displayName,
      canonicalName: extraction.canonicalName,
      resolutionStatus: "DETERMINISTIC",
      provenance: [{ source: "deterministic", extractor: extraction.extractor, confidence: 1, timestamp, field: extraction.field, value: extraction.canonicalName }],
      createdAt: timestamp,
      updatedAt: timestamp,
      resolverVersion: DETERMINISTIC_RESOLVER_VERSION,
      schemaVersion: ENTITY_SCHEMA_VERSION,
      metadata: {},
    };
  }
}

export const deterministicEntityResolver = new DeterministicEntityResolver();

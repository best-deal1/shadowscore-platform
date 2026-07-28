export type EntityType =
  | "company"
  | "person"
  | "domain"
  | "wallet"
  | "marketplace_seller"
  | "email"
  | "phone"
  | "organization";

export type ResolutionStatus =
  | "DETERMINISTIC"
  | "AUTHORITATIVE"
  | "AI_ASSISTED"
  | "AMBIGUOUS"
  | "FAILED";

export type EntityProvenance = {
  source: "deterministic" | "authoritative" | "ai_assisted";
  extractor: string;
  confidence: number;
  timestamp: string;
  field: string;
  value: string;
  metadata?: Record<string, unknown>;
};

export type ResolvedEntity = {
  entityId: string;
  entityType: EntityType;
  displayName: string;
  canonicalName: string;
  resolutionStatus: ResolutionStatus;
  provenance: EntityProvenance[];
  createdAt: string;
  updatedAt: string;
  resolverVersion: string;
  schemaVersion: string;
  metadata: Record<string, unknown>;
};

export type EntityResolutionInput = {
  target: string;
  companyId?: string;
  companyTicker?: string;
  platform?: string;
  email?: string;
};

export interface EntityResolver {
  resolve(input: EntityResolutionInput): ResolvedEntity;
}

import type { KnowledgeEntity, KnowledgeEntityInput, KnowledgeEntityType } from "./types";

const ENTITY_PREFIX: Record<KnowledgeEntityType, string> = {
  Business: "business",
  Domain: "domain",
  Email: "email",
  Phone: "phone",
  "Marketplace Seller": "marketplace-seller",
  "Marketplace Store": "marketplace-store",
  Brand: "brand",
  Company: "company",
  "Social Profile": "social-profile",
};

export function normalizeEntityValue(type: KnowledgeEntityType, value: string) {
  const trimmed = value.trim();
  if (type === "Email" || type === "Domain") return trimmed.toLowerCase();
  if (type === "Phone") return trimmed.replace(/[^+0-9]/g, "");
  if (type === "Social Profile") return trimmed.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

export function stableToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9+@.]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

export function entityId(type: KnowledgeEntityType, value: string) {
  return `${ENTITY_PREFIX[type]}:${stableToken(normalizeEntityValue(type, value))}`;
}

export function createEntity(input: KnowledgeEntityInput, fallbackScanId?: string): KnowledgeEntity {
  const normalizedValue = normalizeEntityValue(input.type, input.value);
  const sourceScanId = input.sourceScanId || fallbackScanId;

  return {
    id: entityId(input.type, input.value),
    type: input.type,
    label: input.label || input.value.trim(),
    normalizedValue,
    aliases: uniqueSorted([...(input.aliases || []), input.value, input.label || ""].filter(Boolean).map((value) => normalizeEntityValue(input.type, value))),
    attributes: { ...(input.attributes || {}) },
    sourceScanIds: sourceScanId ? [sourceScanId] : [],
  };
}

export function mergeEntities(existing: KnowledgeEntity, incoming: KnowledgeEntity): { entity: KnowledgeEntity; changed: boolean } {
  const aliases = uniqueSorted([...existing.aliases, ...incoming.aliases]);
  const sourceScanIds = uniqueSorted([...existing.sourceScanIds, ...incoming.sourceScanIds]);
  const attributes = { ...existing.attributes, ...incoming.attributes };
  const entity = {
    ...existing,
    label: existing.label || incoming.label,
    aliases,
    attributes,
    sourceScanIds,
  };
  const changed = JSON.stringify(entity) !== JSON.stringify(existing);

  return { entity, changed };
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

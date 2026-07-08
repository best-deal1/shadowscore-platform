import { stableToken } from "./entities";
import type { KnowledgeRelationship, KnowledgeRelationshipInput, KnowledgeRelationshipType } from "./types";

export function relationshipId(type: KnowledgeRelationshipType, from: string, to: string, context?: string) {
  return `${from}->${to}:${type}${context ? `:${stableToken(context)}` : ""}`;
}

export function createRelationship(input: Omit<KnowledgeRelationshipInput, "from" | "to"> & { from: string; to: string }, fallbackScanId?: string): KnowledgeRelationship {
  const sourceScanId = input.sourceScanId || fallbackScanId;

  return {
    id: relationshipId(input.type, input.from, input.to, input.context),
    type: input.type,
    from: input.from,
    to: input.to,
    context: input.context,
    sourceScanIds: sourceScanId ? [sourceScanId] : [],
  };
}

export function mergeRelationships(existing: KnowledgeRelationship, incoming: KnowledgeRelationship): { relationship: KnowledgeRelationship; changed: boolean } {
  const sourceScanIds = Array.from(new Set([...existing.sourceScanIds, ...incoming.sourceScanIds])).sort();
  return {
    relationship: { ...existing, sourceScanIds },
    changed: sourceScanIds.length !== existing.sourceScanIds.length,
  };
}

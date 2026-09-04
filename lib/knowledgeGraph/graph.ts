import { createEntity, mergeEntities, normalizeEntityValue } from "./entities";
import { createRelationship, mergeRelationships } from "./relationships";
import { deterministicEntityResolver, type EntityResolver } from "./resolver";
import type {
  KnowledgeEntity,
  KnowledgeEntityInput,
  KnowledgeEntityType,
  KnowledgeGraphSnapshot,
  KnowledgeGraphSummary,
  KnowledgeRelationship,
  KnowledgeRelationshipInput,
  KnowledgeRelationshipType,
  KnowledgeScanInput,
  KnowledgeScanResult,
} from "./types";

const ENTITY_TYPES: KnowledgeEntityType[] = ["Business", "Domain", "Email", "Phone", "Marketplace Seller", "Marketplace Store", "Brand", "Company", "Social Profile"];
const RELATIONSHIP_TYPES: KnowledgeRelationshipType[] = ["OWNS", "USES", "BELONGS_TO", "HAS_EMAIL", "HAS_PHONE", "OPERATES_ON", "SHARES_IDENTITY_WITH", "LINKED_TO"];

export class BusinessKnowledgeGraph {
  private readonly resolver: EntityResolver;
  private readonly entities = new Map<string, KnowledgeEntity>();
  private readonly relationships = new Map<string, KnowledgeRelationship>();

  constructor(resolver: EntityResolver = deterministicEntityResolver) {
    this.resolver = resolver;
  }

  applyScan(scan: KnowledgeScanInput): KnowledgeScanResult {
    const entitiesCreated: KnowledgeEntity[] = [];
    const entitiesUpdated: KnowledgeEntity[] = [];
    const relationshipsCreated: KnowledgeRelationship[] = [];
    const linkedEntityIds = new Set<string>();

    for (const input of scan.entities || []) {
      const result = this.upsertEntity(input, scan.scanId);
      if (result.created) pushUniqueEntity(entitiesCreated, result.entity);
      if (result.updated) pushUniqueEntity(entitiesUpdated, result.entity);
    }

    for (const relationship of scan.relationships || []) {
      const from = this.resolveRelationshipEndpoint(relationship.from, scan.scanId, entitiesCreated, entitiesUpdated);
      const to = this.resolveRelationshipEndpoint(relationship.to, scan.scanId, entitiesCreated, entitiesUpdated);
      if (!from || !to) continue;

      linkedEntityIds.add(from.id);
      linkedEntityIds.add(to.id);

      const created = this.upsertRelationship({ ...relationship, from: from.id, to: to.id }, scan.scanId);
      if (created) relationshipsCreated.push(created);
    }

    return {
      entitiesCreated,
      entitiesUpdated,
      relationshipsCreated,
      linkedEntities: this.sortedEntities().filter((entity) => linkedEntityIds.has(entity.id)),
      graphSummary: this.summary(),
    };
  }

  snapshot(): KnowledgeGraphSnapshot {
    return {
      entities: this.sortedEntities(),
      relationships: this.sortedRelationships(),
      graphSummary: this.summary(),
    };
  }

  private resolveRelationshipEndpoint(input: KnowledgeEntityInput | string, scanId: string, entitiesCreated: KnowledgeEntity[], entitiesUpdated: KnowledgeEntity[]) {
    const resolved = this.resolver.resolve(input, this.entities, scanId);
    if (!resolved) return undefined;
    if (this.entities.has(resolved.id)) return resolved;

    const result = this.upsertEntity(resolved, scanId);
    if (result.created) pushUniqueEntity(entitiesCreated, result.entity);
    if (result.updated) pushUniqueEntity(entitiesUpdated, result.entity);
    return result.entity;
  }

  private upsertEntity(input: KnowledgeEntityInput | KnowledgeEntity, scanId: string) {
    const incoming = "normalizedValue" in input ? input : createEntity(input, scanId);
    const existing = this.entities.get(incoming.id);
    if (!existing) {
      this.entities.set(incoming.id, incoming);
      return { entity: incoming, created: true, updated: false };
    }

    const merged = mergeEntities(existing, incoming);
    this.entities.set(incoming.id, merged.entity);
    return { entity: merged.entity, created: false, updated: merged.changed };
  }

  private upsertRelationship(input: Omit<KnowledgeRelationshipInput, "from" | "to"> & { from: string; to: string }, scanId: string) {
    const incoming = createRelationship(input, scanId);
    const existing = this.relationships.get(incoming.id);
    if (!existing) {
      this.relationships.set(incoming.id, incoming);
      return incoming;
    }

    this.relationships.set(incoming.id, mergeRelationships(existing, incoming).relationship);
    return undefined;
  }

  private sortedEntities() {
    return Array.from(this.entities.values()).sort((left, right) => left.id.localeCompare(right.id));
  }

  private sortedRelationships() {
    return Array.from(this.relationships.values()).sort((left, right) => left.id.localeCompare(right.id));
  }

  private summary(): KnowledgeGraphSummary {
    const entityTypes = Object.fromEntries(ENTITY_TYPES.map((type) => [type, 0])) as Record<KnowledgeEntityType, number>;
    const relationshipTypes = Object.fromEntries(RELATIONSHIP_TYPES.map((type) => [type, 0])) as Record<KnowledgeRelationshipType, number>;

    for (const entity of this.entities.values()) entityTypes[entity.type] += 1;
    for (const relationship of this.relationships.values()) relationshipTypes[relationship.type] += 1;

    return {
      entityCount: this.entities.size,
      relationshipCount: this.relationships.size,
      entityTypes,
      relationshipTypes,
    };
  }
}

export function pushUniqueEntity(items: KnowledgeEntity[], entity: KnowledgeEntity) {
  if (!items.some((item) => item.id === entity.id)) items.push(entity);
}

export function applyKnowledgeScan(graph: BusinessKnowledgeGraph, scan: KnowledgeScanInput) {
  return graph.applyScan(scan);
}

export function normalizeKnowledgeEntity(type: KnowledgeEntityType, value: string) {
  return normalizeEntityValue(type, value);
}

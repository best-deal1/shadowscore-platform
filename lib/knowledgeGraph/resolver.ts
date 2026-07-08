import { createEntity, entityId, normalizeEntityValue } from "./entities";
import type { KnowledgeEntity, KnowledgeEntityInput } from "./types";

export type EntityResolver = {
  resolve(input: KnowledgeEntityInput | string, entities: Map<string, KnowledgeEntity>, fallbackScanId?: string): KnowledgeEntity | undefined;
};

export const deterministicEntityResolver: EntityResolver = {
  resolve(input, entities, fallbackScanId) {
    if (typeof input === "string") return entities.get(input);

    const direct = entities.get(entityId(input.type, input.value));
    if (direct) return direct;

    const aliases = [input.value, input.label || "", ...(input.aliases || [])].filter(Boolean);
    for (const entity of entities.values()) {
      if (entity.type !== input.type) continue;
      if (aliases.some((alias) => entity.aliases.includes(normalizeEntityValue(input.type, alias)))) return entity;
    }

    return createEntity(input, fallbackScanId);
  },
};

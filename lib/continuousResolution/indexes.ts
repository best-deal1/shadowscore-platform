import { normalizeValue } from "../entityIntelligence/resolver";
import type { Entity, ObservationAttribute } from "../entityIntelligence/types";
import type { IdentityIndexAttribute } from "./types";

const attributes: IdentityIndexAttribute[] = ["registration_id", "domain", "email", "phone", "alias", "name", "address", "director"];
const observationAttribute = (attribute: IdentityIndexAttribute): ObservationAttribute => attribute === "alias" ? "name" : attribute;

export class IdentityIndex {
  private readonly values = new Map<IdentityIndexAttribute, Map<string, Set<string>>>(attributes.map(attribute => [attribute, new Map()]));
  private readonly entityKeys = new Map<string, Array<[IdentityIndexAttribute, string]>>();

  upsert(entity: Entity) {
    this.remove(entity.entityId);
    const source: Record<IdentityIndexAttribute, string[]> = {
      registration_id: entity.registrationIdentifiers, domain: entity.domains,
      email: entity.emailAddresses, phone: entity.phoneNumbers, alias: entity.aliases,
      name: [entity.canonicalName], address: entity.addresses, director: entity.peopleAndDirectors,
    };
    const keys: Array<[IdentityIndexAttribute, string]> = [];
    for (const attribute of attributes) for (const raw of source[attribute]) {
      const value = normalizeValue(observationAttribute(attribute), raw);
      if (!value) continue;
      const bucket = this.values.get(attribute)!;
      bucket.set(value, new Set([...(bucket.get(value) ?? []), entity.entityId]));
      keys.push([attribute, value]);
    }
    this.entityKeys.set(entity.entityId, keys);
  }

  remove(entityId: string) {
    for (const [attribute, value] of this.entityKeys.get(entityId) ?? []) {
      const bucket = this.values.get(attribute)!.get(value);
      bucket?.delete(entityId);
      if (!bucket?.size) this.values.get(attribute)!.delete(value);
    }
    this.entityKeys.delete(entityId);
  }

  candidates(attribute: ObservationAttribute, normalizedValue: string) {
    const indexAttributes: IdentityIndexAttribute[] = attribute === "name" ? ["name", "alias"] : [attribute as IdentityIndexAttribute];
    return [...new Set(indexAttributes.flatMap(key => [...(this.values.get(key)?.get(normalizedValue) ?? [])]))].sort();
  }

  get indexedValues() { return [...this.values.values()].reduce((total, index) => total + index.size, 0); }
  health() { return attributes.map(attribute => ({ attribute, values: this.values.get(attribute)!.size })); }
  clear() { this.values.forEach(index => index.clear()); this.entityKeys.clear(); }
}

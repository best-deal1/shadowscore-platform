import type { ProviderEvidence, ProviderResult } from "../providers/types";
import type { BusinessEvidenceReference, BusinessFinding, BusinessFindingCategory, BusinessIntelligenceResult } from "./types";

export type { BusinessEvidenceReference, BusinessFinding, BusinessFindingCategory, BusinessFindingDirection, BusinessIntelligenceResult } from "./types";

export const BUSINESS_INTELLIGENCE_ENGINE_VERSION = "business-intelligence-v1";

type Field = "identity" | "ownership" | "payment" | "operations" | "infrastructure" | "claim";
type Observation = BusinessEvidenceReference & { normalizedValue: string; field: Field; comparisonKey: string };

const FIELD_PATTERNS: Array<{ field: Field; pattern: RegExp }> = [
  { field: "ownership", pattern: /registrant|registered owner|beneficial owner|domain owner|owner(?:ship)?|legal entity|company name/i },
  { field: "payment", pattern: /payment (?:provider|processor|account|merchant)|merchant (?:name|id)|paypal|stripe|payoneer|bank account/i },
  { field: "infrastructure", pattern: /ip address|ip |name server|nameserver|hosting|cdn|tracking id|analytics id|tls fingerprint|certificate fingerprint/i },
  { field: "operations", pattern: /support (?:email|phone|hours)|contact (?:email|phone|address)|address|telephone|phone|operating (?:country|hours)|fulfillment/i },
  { field: "claim", pattern: /claim|official|authorized|years? (?:in business|active)|ships? (?:from|to)|made in|location|return policy/i },
  { field: "identity", pattern: /business name|brand|store name|seller name|organization|company|identity|email|domain|website/i },
];

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\s+/g, " ");
}

function fieldFor(label: string, key?: string): Field | undefined {
  const text = `${key || ""} ${label}`;
  if (/business name|brand|store name|seller name|organization|identity|email|domain|website/i.test(text)) return "identity";
  return FIELD_PATTERNS.find((item) => item.pattern.test(text))?.field;
}

function comparisonKeyFor(field: Field, label: string, key?: string) {
  if (field !== "identity") return field;
  const text = `${key || ""} ${label}`.toLowerCase();
  if (/email/.test(text)) return "identity_email";
  if (/domain|website/.test(text)) return "identity_domain";
  if (/business name|brand|store name|seller name|organization|company|identity/.test(text)) return "identity_name";
  return "identity_other";
}

function add(out: Observation[], result: ProviderResult, evidence: Pick<ProviderEvidence, "id" | "label" | "value" | "source">, key?: string) {
  if (!evidence.value?.trim() || evidence.value.trim().toLowerCase() === "unavailable") return;
  const field = fieldFor(evidence.label, key);
  if (!field) return;
  out.push({ ...evidence, value: evidence.value.trim(), source: evidence.source || result.providerId, providerId: result.providerId, observedAt: result.completedAt, field, comparisonKey: comparisonKeyFor(field, evidence.label, key), normalizedValue: normalize(evidence.value) });
}

function observations(results: ProviderResult[]) {
  const out: Observation[] = [];
  for (const result of results.filter((item) => item.status === "completed")) {
    result.evidence.forEach((evidence) => add(out, result, evidence));
    for (const [key, value] of Object.entries(result.metadata)) {
      if (typeof value === "string") add(out, result, { id: `metadata:${key}`, label: key.replace(/([A-Z])/g, " $1"), value, source: result.providerId }, key);
    }
  }
  return out;
}

function independent(items: Observation[]) { return new Set(items.map((item) => item.providerId)).size >= 2; }
function refs(items: Observation[]) { return items.map((item) => ({ id: item.id, label: item.label, value: item.value, source: item.source, providerId: item.providerId, observedAt: item.observedAt, field: item.field })); }
function finding(category: BusinessFindingCategory, direction: BusinessFinding["direction"], title: string, statement: string, items: Observation[]): BusinessFinding {
  const fields = Array.from(new Set(items.map((item) => item.field)));
  return { id: `${category}:${fields.join("-")}:${items.map((item) => item.providerId).sort().join("-")}`, category, direction, title, statement, evidence: refs(items), affectedFields: fields };
}

const CONFLICT_CATEGORY: Record<Field, BusinessFindingCategory> = { identity: "identity_mismatch", ownership: "ownership_inconsistency", payment: "payment_inconsistency", operations: "operational_contradiction", infrastructure: "suspicious_infrastructure_reuse", claim: "conflicting_business_claim" };

/** Correlates observations from separate providers. It emits no finding from an uncorroborated provider result. */
export function buildBusinessIntelligence(providerResults: ProviderResult[], generatedAt = new Date().toISOString()): BusinessIntelligenceResult {
  const observed = observations(providerResults);
  const findings: BusinessFinding[] = [];
  for (const field of ["identity", "ownership", "payment", "operations", "claim"] as Field[]) {
    const fieldItems = observed.filter((item) => item.field === field);
    for (const comparisonKey of new Set(fieldItems.map((item) => item.comparisonKey))) {
      const items = fieldItems.filter((item) => item.comparisonKey === comparisonKey);
      const values = new Map<string, Observation[]>();
      items.forEach((item) => values.set(item.normalizedValue, [...(values.get(item.normalizedValue) || []), item]));
      const corroborated = [...values.values()].filter(independent);
      corroborated.forEach((itemsForValue) => findings.push(finding("credibility_support", "supports_credibility", `Corroborated ${field} record`, `Independent providers reported the same ${field} value: ${itemsForValue[0].value}.`, itemsForValue)));
      if (values.size > 1 && independent(items)) {
        findings.push(finding(CONFLICT_CATEGORY[field], "needs_review", `Conflicting ${field} records`, `Independent providers reported different ${field} values. The available evidence requires reconciliation.`, items));
        findings.push(finding("credibility_weakening", "weakens_credibility", `${field[0].toUpperCase()}${field.slice(1)} evidence weakens credibility`, `The conflicting ${field} records weaken confidence in the business information until they are reconciled.`, items));
      }
    }
  }
  const infrastructure = observed.filter((item) => item.field === "infrastructure");
  const byInfrastructure = new Map<string, Observation[]>();
  infrastructure.forEach((item) => byInfrastructure.set(item.normalizedValue, [...(byInfrastructure.get(item.normalizedValue) || []), item]));
  for (const items of byInfrastructure.values()) {
    const businessValues = new Set(observed.filter((candidate) => candidate.field === "identity" && candidate.providerId && items.some((item) => item.providerId === candidate.providerId)).map((candidate) => candidate.normalizedValue));
    if (independent(items) && businessValues.size > 1) findings.push(finding("suspicious_infrastructure_reuse", "needs_review", "Infrastructure reused across distinct identity records", "The same infrastructure value appears with distinct identity records from independent providers. This is a review signal, not a conclusion about ownership or intent.", items));
  }
  const deduped = findings.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id && candidate.title === item.title) === index);
  return { engineVersion: BUSINESS_INTELLIGENCE_ENGINE_VERSION, generatedAt, findings: deduped, evidenceCount: observed.length, providersCorrelated: Array.from(new Set(observed.map((item) => item.providerId))).sort() };
}

import type { BusinessChange, BusinessMemoryEntity, BusinessSnapshot, StabilityLevel } from "./types";

const norm = (value?: string) => (value ?? "").trim().toLowerCase();
const uniq = (values: string[]) => [...new Set(values.map(norm).filter(Boolean))].sort();

function valuesByEntityType(snapshot: BusinessSnapshot, type: string): string[] {
  return snapshot.entities.filter((entity) => norm(entity.type) === type).map((entity) => entity.value);
}

function emails(snapshot: BusinessSnapshot): string[] {
  return uniq([...(snapshot.identity.emails ?? []), ...valuesByEntityType(snapshot, "email")]);
}

function phones(snapshot: BusinessSnapshot): string[] {
  return uniq([...(snapshot.identity.phones ?? []), ...valuesByEntityType(snapshot, "phone")]);
}

function domains(snapshot: BusinessSnapshot): string[] {
  return uniq([snapshot.identity.domain ?? "", ...valuesByEntityType(snapshot, "domain")]);
}

function owners(snapshot: BusinessSnapshot): string[] {
  return uniq(snapshot.relationships.filter((rel) => norm(rel.type).includes("own")).map((rel) => `${rel.from}->${rel.to}`));
}

function providers(snapshot: BusinessSnapshot): string[] {
  const evidenceSources = snapshot.evidence.map((item) => item.source ?? "");
  const providerEntities = snapshot.entities
    .filter((entity: BusinessMemoryEntity) => norm(entity.type).includes("provider"))
    .map((entity) => entity.value);
  return uniq([...evidenceSources, ...providerEntities]);
}

function evidenceFingerprints(snapshot: BusinessSnapshot): string[] {
  return uniq(snapshot.evidence.map((item) => `${item.type ?? "evidence"}:${item.label}:${item.value ?? ""}:${item.source ?? ""}`));
}

function addSetChanges(changes: BusinessChange[], previous: string[], latest: string[], addedType: BusinessChange["type"], removedType: BusinessChange["type"], field: string): void {
  latest.filter((value) => !previous.includes(value)).forEach((value) => changes.push({ type: addedType, field, latestValue: value, summary: `New ${field} detected: ${value}` }));
  previous.filter((value) => !latest.includes(value)).forEach((value) => changes.push({ type: removedType, field, previousValue: value, summary: `Removed ${field} detected: ${value}` }));
}

export function diffBusinessSnapshots(previous: BusinessSnapshot, latest: BusinessSnapshot): BusinessChange[] {
  const changes: BusinessChange[] = [];
  addSetChanges(changes, emails(previous), emails(latest), "new_email", "removed_email", "email");
  addSetChanges(changes, phones(previous), phones(latest), "new_phone", "removed_phone", "phone");
  addSetChanges(changes, domains(previous), domains(latest), "new_domain", "removed_domain", "domain");
  addSetChanges(changes, owners(previous), owners(latest), "ownership_change", "ownership_change", "ownership");
  addSetChanges(changes, providers(previous), providers(latest), "provider_change", "provider_change", "provider");

  if ((previous.decision?.decision ?? "") !== (latest.decision?.decision ?? "")) {
    changes.push({ type: "decision_change", field: "decision", previousValue: previous.decision?.decision, latestValue: latest.decision?.decision, summary: `Decision changed from ${previous.decision?.decision ?? "none"} to ${latest.decision?.decision ?? "none"}` });
  }

  addSetChanges(changes, evidenceFingerprints(previous), evidenceFingerprints(latest), "evidence_change", "evidence_change", "evidence");
  return changes;
}

export function getStabilityLevel(changes: BusinessChange[], hasPreviousSnapshot: boolean): StabilityLevel {
  if (!hasPreviousSnapshot) return "first_scan";
  if (changes.length === 0) return "stable";
  if (changes.length <= 2) return "low_change";
  if (changes.length <= 5) return "moderate_change";
  return "high_change";
}

export function summarizeChanges(changes: BusinessChange[], hasPreviousSnapshot: boolean): string {
  if (!hasPreviousSnapshot) return "First scan recorded; no previous business snapshot to compare.";
  if (changes.length === 0) return "No changes detected since the previous scan.";
  return changes.map((change) => change.summary).join("; ");
}

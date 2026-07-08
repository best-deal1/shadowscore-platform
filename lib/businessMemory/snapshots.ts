import type { BusinessMemoryDecision, BusinessSnapshot, BusinessSnapshotInput } from "./types";

const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

export function createBusinessKey(identity: BusinessSnapshotInput["identity"]): string {
  const identifier = identity.id ?? identity.identifiers?.taxId ?? identity.identifiers?.registrationId;
  const primary = identifier ?? identity.domain ?? identity.emails?.[0] ?? identity.name ?? identity.legalName ?? "unknown-business";
  return normalize(primary).replace(/\s+/g, "-");
}

function normalizeDecision(decision?: BusinessSnapshotInput["decision"]): BusinessMemoryDecision | undefined {
  if (!decision) return undefined;
  return typeof decision === "string" ? { decision } : { ...decision };
}

export function createBusinessSnapshot(input: BusinessSnapshotInput): BusinessSnapshot {
  const businessKey = createBusinessKey(input.identity);
  const timestamp = input.timestamp ?? new Date().toISOString();
  const scanId = input.scanId ?? `${businessKey}-${timestamp}`;

  return {
    id: `${businessKey}:${scanId}`,
    businessKey,
    scanId,
    identity: { ...input.identity },
    entities: [...(input.entities ?? [])],
    relationships: [...(input.relationships ?? [])],
    evidence: [...(input.evidence ?? [])],
    decision: normalizeDecision(input.decision),
    timestamp,
  };
}

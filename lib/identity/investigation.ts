export type PersonalIdentitySignals = {
  email?: string;
  phone?: string;
  name?: string;
  username?: string;
};

export type InvestigationKind = "business" | "personal_identity";

const present = (value?: string) => Boolean(value?.trim());

export function normalizeIdentitySignals(signals?: PersonalIdentitySignals | null): PersonalIdentitySignals {
  if (!signals) return {};
  return Object.fromEntries(Object.entries(signals)
    .filter((entry): entry is [keyof PersonalIdentitySignals, string] => present(entry[1]))
    .map(([key, value]) => [key, key === "email" ? value.trim().toLowerCase() : value.trim()])) as PersonalIdentitySignals;
}

export function investigationObjective(signals: PersonalIdentitySignals): string {
  const normalized = normalizeIdentitySignals(signals);
  const kinds = (Object.keys(normalized) as Array<keyof PersonalIdentitySignals>);
  if (kinds.length > 1) return "Determine whether the submitted personal identity signals refer to the same person and document conflicting public evidence.";
  if (normalized.email) return `Investigate public identity evidence associated with the submitted email address ${normalized.email}.`;
  if (normalized.phone) return `Investigate public identity evidence associated with the submitted phone number ${normalized.phone}.`;
  if (normalized.name) return `Investigate public identity evidence associated with the submitted name ${normalized.name}.`;
  if (normalized.username) return `Investigate public identity evidence associated with the submitted username ${normalized.username}.`;
  return "Investigate the submitted business and document the available evidence.";
}

export const PERSONAL_IDENTITY_PRODUCT = {
  name: "Personal Identity Investigation",
  subjectLabel: "Person",
  recordLabel: "Personal Identity Investigation record",
  confirmationTitle: "Confirm the person",
} as const;

export function productForInvestigation(kind: InvestigationKind) {
  return kind === "personal_identity" ? PERSONAL_IDENTITY_PRODUCT : {
    name: "Business Investigation",
    subjectLabel: "Business",
    recordLabel: "Business Investigation record",
    confirmationTitle: "Confirm the business",
  } as const;
}

export type IdentityWorkflowReadiness = { enabled: boolean; schema: boolean; bucket: boolean; policies: boolean; reason?: string };

/**
 * Production identity traffic is fail-closed. Operators set every readiness
 * marker only after applying and verifying the migration.
 */
export function identityWorkflowReadiness(env: NodeJS.ProcessEnv = process.env): IdentityWorkflowReadiness {
  const enabled = env.PERSONAL_IDENTITY_WORKFLOW_ENABLED === "true";
  const schema = env.PERSONAL_IDENTITY_SCHEMA_READY === "true";
  const bucket = env.PERSONAL_IDENTITY_STORAGE_READY === "true";
  const policies = env.PERSONAL_IDENTITY_STORAGE_POLICIES_READY === "true";
  const ready = enabled && schema && bucket && policies;
  return { enabled: ready, schema, bucket, policies, ...(!ready && { reason: "Personal identity investigations are temporarily unavailable while secure storage is being prepared." }) };
}

export const IDENTITY_EVIDENCE_BUCKET = "identity-evidence" as const;

export type IdentitySignals = {
  emails: string[];
  phones: string[];
  names: string[];
  usernames: string[];
  referenceImages: string[];
};

export type IdentityReadinessEnvironment = Record<string, string | undefined>;

const enabled = (value?: string) => value?.trim().toLowerCase() === "true";

export function identityReadinessIssues(environment: IdentityReadinessEnvironment) {
  return [
    ["NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED", "The personal identity intake is disabled."],
    ["PERSONAL_IDENTITY_ENABLED", "Personal identity investigations are disabled."],
    ["IDENTITY_MIGRATION_APPLIED", "The personal identity database migration is not verified."],
    ["IDENTITY_EVIDENCE_BUCKET_READY", `The ${IDENTITY_EVIDENCE_BUCKET} bucket is not verified.`],
    ["IDENTITY_STORAGE_POLICIES_VERIFIED", "Owner-scoped identity storage policies are not verified."],
  ].flatMap(([key, message]) => enabled(environment[key]) ? [] : [message]);
}

export function isIdentityInvestigationReady(environment: IdentityReadinessEnvironment = process.env) {
  return identityReadinessIssues(environment).length === 0;
}

const unique = (values: unknown, normalize: (value: string) => string) => Array.isArray(values)
  ? [...new Set(values.filter((value): value is string => typeof value === "string").map((value) => normalize(value.trim())).filter(Boolean))]
  : [];

export function normalizeIdentitySignals(value: unknown): IdentitySignals {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    emails: unique(input.emails, (item) => item.toLowerCase()),
    phones: unique(input.phones, (item) => item.replace(/[^+\d]/g, "")),
    names: unique(input.names, (item) => item.replace(/\s+/g, " ")),
    usernames: unique(input.usernames, (item) => item.replace(/^@/, "").toLowerCase()),
    referenceImages: unique(input.referenceImages, (item) => item),
  };
}

export function identityObjective(signals: IdentitySignals) {
  const labels = [
    signals.emails.length && "email address",
    signals.phones.length && "phone number",
    signals.names.length && "name",
    signals.usernames.length && "username",
    signals.referenceImages.length && "authorized reference image",
  ].filter(Boolean) as string[];
  if (labels.length === 1) return `Investigate the person associated with the submitted ${labels[0]}.`;
  return `Investigate whether the submitted ${labels.join(", ")} signals refer to the same person.`;
}

export type ContactEvidence = { type: "email" | "phone"; value: string; sourceUrl: string; sourceFamily: string };

export function preserveContradictoryContacts(items: ContactEvidence[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}|${item.value.toLowerCase()}|${item.sourceUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function independentSourceCount(items: Array<{ sourceUrl: string; sourceFamily: string }>) {
  return new Set(items.map((item) => item.sourceFamily.trim().toLowerCase()).filter(Boolean)).size;
}

export function scoreIdentityCandidate(input: { matchedSignalTypes: string[]; evidence: Array<{ sourceUrl: string; sourceFamily: string }>; contradictions: number }) {
  const signalScore = new Set(input.matchedSignalTypes).size * 22;
  const sourceScore = Math.min(independentSourceCount(input.evidence), 3) * 12;
  return Math.max(0, Math.min(100, signalScore + sourceScore - input.contradictions * 20));
}

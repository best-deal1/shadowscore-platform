import type { ExternalIdentityCandidate } from "./providers/externalIdentityProvider";

export const IDENTITY_EVIDENCE_BUCKET = "identity-evidence" as const;

export type IdentityRequestedAttribute = "phone" | "email" | "social_profile" | "identity_match";

export type IdentitySignals = {
  emails: string[];
  phones: string[];
  names: string[];
  usernames: string[];
  referenceImages: string[];
  organizations?: string[];
  roles?: string[];
  requestedAttributes?: IdentityRequestedAttribute[];
  requestText?: string;
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

export function identityInvestigationGuardIssues(
  isPersonalIdentity: boolean,
  signals: IdentitySignals,
  environment: IdentityReadinessEnvironment = process.env,
) {
  if (!isPersonalIdentity) return [];
  const issues = identityReadinessIssues(environment);
  if (!hasSubmittedIdentitySignal(signals)) issues.push("At least one identity signal is required.");
  return issues;
}

const unique = (values: unknown, normalize: (value: string) => string) => Array.isArray(values)
  ? [...new Set(values.filter((value): value is string => typeof value === "string").map((value) => normalize(value.trim())).filter(Boolean))]
  : [];

export function normalizeIdentitySignals(value: unknown): IdentitySignals {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const signals: IdentitySignals = {
    emails: unique(input.emails, (item) => item.toLowerCase()),
    phones: unique(input.phones, (item) => item.replace(/[^+\d]/g, "")),
    names: unique(input.names, (item) => item.replace(/\s+/g, " ")),
    usernames: unique(input.usernames, (item) => item.replace(/^@/, "").toLowerCase()),
    referenceImages: unique(input.referenceImages, (item) => item),
  };
  if (Array.isArray(input.organizations)) signals.organizations = unique(input.organizations, (item) => item.replace(/\s+/g, " "));
  if (Array.isArray(input.roles)) signals.roles = unique(input.roles, (item) => item.replace(/\s+/g, " "));
  if (Array.isArray(input.requestedAttributes)) {
    const supported = new Set<IdentityRequestedAttribute>(["phone", "email", "social_profile", "identity_match"]);
    signals.requestedAttributes = unique(input.requestedAttributes, (item) => item.toLowerCase())
      .filter((item): item is IdentityRequestedAttribute => supported.has(item as IdentityRequestedAttribute));
  }
  if (typeof input.requestText === "string" && input.requestText.trim()) signals.requestText = input.requestText.trim().slice(0, 500);
  return signals;
}

const hasSubmittedIdentitySignal = (signals: IdentitySignals) =>
  [signals.emails, signals.phones, signals.names, signals.usernames, signals.referenceImages].some((items) => items.length > 0);

/**
 * Normalize the canonical identity payload and recover older personal intakes
 * that stored the investigated subject only in target or email. Structured
 * signals remain authoritative when at least one was submitted.
 */
export function normalizeIntakeIdentitySignals(value: unknown, legacy: { target?: unknown; email?: unknown } = {}): IdentitySignals {
  const structured = normalizeIdentitySignals(value);
  if (hasSubmittedIdentitySignal(structured)) return structured;

  const targetValues = [legacy.target]
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbackEmail = typeof legacy.email === "string" ? legacy.email.trim() : "";
  const legacyValues = targetValues.length ? targetValues : [fallbackEmail].filter(Boolean);
  const emails = legacyValues.filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  const phones = legacyValues.filter((item) => /^\+?[\d\s().-]{7,}$/.test(item));
  return normalizeIdentitySignals({
    emails,
    phones,
    usernames: legacyValues.filter((item) => /^@?[a-z0-9_.-]{2,}$/i.test(item) && !emails.includes(item) && !phones.includes(item)),
    names: legacyValues.filter((item) => /\s/.test(item) && !emails.includes(item) && !phones.includes(item)),
    organizations: structured.organizations,
    roles: structured.roles,
    requestedAttributes: structured.requestedAttributes,
    requestText: structured.requestText,
  });
}

export function identityObjective(signals: IdentitySignals) {
  const labels = [
    signals.emails.length && "email address",
    signals.phones.length && "phone number",
    signals.names.length && "name",
    signals.usernames.length && "username",
    signals.referenceImages.length && "authorized reference image",
  ].filter(Boolean) as string[];
  const base = labels.length === 1
    ? `Investigate the person associated with the submitted ${labels[0]}.`
    : `Investigate whether the submitted ${labels.join(", ")} signals refer to the same person.`;
  const organization = signals.organizations?.[0];
  const role = signals.roles?.[0];
  const context = organization
    ? ` Review whether public evidence links the person to ${organization}${role ? ` as ${role}` : ""}.`
    : role ? ` Review whether public evidence supports the role ${role}.` : "";
  const requested = signals.requestedAttributes?.map((attribute) => attribute === "phone" ? "phone number" : attribute === "email" ? "email address" : attribute === "social_profile" ? "public profile" : "identity match") || [];
  const result = requested.length ? ` Return only source-backed ${requested.join(", ")} results.` : "";
  return `${base}${context}${result}`;
}

export type RequestedIdentityResult = {
  type: "Phone number" | "Email address" | "Public profile" | "Identity match";
  value: string;
  sourceUrl: string;
  association: string;
  corroborated: boolean;
};

export function isCorroboratedIdentityCandidate(candidate: ExternalIdentityCandidate) {
  return candidate.resolutionOutcome === "MATCH"
    && (candidate.resolverMatchedSignals?.length || 0) > 0
    && (candidate.resolverConflictingSignals?.length || 0) === 0
    && (candidate.independentSourceFamilyCount || 0) >= 2;
}

export function requestedIdentityResults(signals: IdentitySignals | undefined, candidates: ExternalIdentityCandidate[]): RequestedIdentityResult[] {
  const requested = new Set(signals?.requestedAttributes || []);
  const results = candidates.flatMap((candidate) => {
    const resultForContact = (type: "email" | "phone", value: string) => {
      const normalized = type === "email" ? value.trim().toLowerCase() : value.replace(/\D/g, "");
      const evidence = (candidate.observedContactProvenance || []).filter((entry) => entry.type === type
        && (type === "email" ? entry.value.trim().toLowerCase() : entry.value.replace(/\D/g, "")) === normalized);
      const sourceUrl = evidence[0]?.url || candidate.sourceProvenance?.[0]?.url || candidate.profileUrl;
      const independentlyRepeated = new Set(evidence.map((entry) => entry.family)).size >= 2;
      const corroborated = isCorroboratedIdentityCandidate(candidate) && independentlyRepeated;
      return { sourceUrl, corroborated, association: corroborated ? "Linked to a corroborated identity candidate" : "Observed on an unverified candidate source" };
    };
    const sourceUrl = candidate.sourceProvenance?.[0]?.url || candidate.profileUrl;
    const corroborated = isCorroboratedIdentityCandidate(candidate);
    const association = corroborated ? "Linked to a corroborated identity candidate" : "Observed on an unverified candidate source";
    return [
      ...(requested.has("phone") ? (candidate.observedPhoneNumbers || []).map((value) => ({ type: "Phone number" as const, value, ...resultForContact("phone", value) })) : []),
      ...(requested.has("email") ? (candidate.observedEmails || []).map((value) => ({ type: "Email address" as const, value, ...resultForContact("email", value) })) : []),
      ...(requested.has("social_profile") ? [{ type: "Public profile" as const, value: candidate.profileUrl, sourceUrl, association, corroborated }] : []),
      ...(requested.has("identity_match") && corroborated ? [{ type: "Identity match" as const, value: candidate.observedDisplayName || candidate.profileUrl, sourceUrl, association, corroborated }] : []),
    ];
  });
  return [...new Map(results.map((result) => [`${result.type}|${result.value}|${result.sourceUrl}`, result])).values()];
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

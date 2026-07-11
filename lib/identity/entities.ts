import type { IdentityContradiction, IdentityObject, IdentitySignal } from "./types";

export function identityId(seed: string): string {
  return `id_${seed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "unknown"}`;
}

export function uniqueSorted(values: string[]): string[] { return Array.from(new Set(values.filter(Boolean))).sort(); }

export function buildIdentity(signals: IdentitySignal[], contradictions: IdentityContradiction[]): Omit<IdentityObject, "confidence" | "confidenceScore"> {
  const aliases = uniqueSorted(signals.filter((s) => s.type === "business_name" || s.type === "organization_schema").map((s) => s.value));
  const domains = uniqueSorted(signals.filter((s) => s.type === "domain" || s.type === "website").map((s) => s.normalizedValue));
  const emails = uniqueSorted(signals.filter((s) => s.type === "email").map((s) => s.normalizedValue));
  const phones = uniqueSorted(signals.filter((s) => s.type === "phone").map((s) => s.normalizedValue));
  const socialProfiles = uniqueSorted(signals.filter((s) => s.type === "social_profile").map((s) => s.normalizedValue));
  const marketplaceAccounts = uniqueSorted(signals.filter((s) => s.type === "marketplace_account").map((s) => s.normalizedValue));
  const paymentAccounts = uniqueSorted(signals.filter((s) => s.type === "payment_account").map((s) => s.normalizedValue));
  const evidenceRefs = uniqueSorted(signals.flatMap((s) => [s.evidenceRef, s.evidenceItemId]));
  const displayName = aliases[0] || domains[0] || emails[0] || phones[0] || socialProfiles[0] || marketplaceAccounts[0] || paymentAccounts[0] || "Unknown identity";
  return { identityId: identityId(displayName), displayName, aliases, domains, emails, phones, socialProfiles, marketplaceAccounts, paymentAccounts, evidenceRefs, contradictions };
}

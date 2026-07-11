import type { IdentityConfidence, IdentityObject } from "./types";

export function confidenceForScore(score: number): IdentityConfidence {
  if (score >= 85) return "Confirmed";
  if (score >= 65) return "Likely";
  if (score >= 35) return "Possible";
  return "Unknown";
}

export function calculateIdentityConfidence(identity: Omit<IdentityObject, "confidence" | "confidenceScore">): { score: number; confidence: IdentityConfidence; calculation: string } {
  let score = 0;
  const parts: string[] = [];
  const strongSignals = [identity.domains.length, identity.emails.length, identity.phones.length, identity.socialProfiles.length, identity.marketplaceAccounts.length, identity.paymentAccounts.length].filter(Boolean).length;
  if (identity.aliases.length > 0) { score += 20; parts.push("business/name signal +20"); }
  if (identity.domains.length > 0) { score += 25; parts.push("domain/website +25"); }
  if (identity.emails.length > 0) { score += 20; parts.push("email +20"); }
  if (identity.phones.length > 0) { score += 15; parts.push("phone +15"); }
  if (identity.socialProfiles.length > 0) { score += 10; parts.push("social profile +10"); }
  if (identity.marketplaceAccounts.length > 0) { score += 10; parts.push("marketplace +10"); }
  if (identity.paymentAccounts.length > 0) { score += 10; parts.push("payment +10"); }
  if (identity.evidenceRefs.length > 2) { score += 10; parts.push("multiple evidence refs +10"); }
  if (strongSignals >= 2) { score += 10; parts.push("cross-signal match +10"); }
  const penalty = identity.contradictions.reduce((sum, item) => sum + (item.severity === "high" ? 30 : item.severity === "medium" ? 20 : 10), 0);
  if (penalty > 0) parts.push(`contradiction penalty -${penalty}`);
  score = Math.max(0, Math.min(100, score - penalty));
  return { score, confidence: confidenceForScore(score), calculation: `${identity.displayName}: ${parts.join(", ") || "no resolvable signals"} = ${score}` };
}

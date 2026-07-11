import { calculateIdentityConfidence } from "./confidence";
import { buildIdentity, identityId, uniqueSorted } from "./entities";
import { extractIdentitySignals, shouldLink } from "./matching";
import type { IdentityContradiction, IdentityGraph, IdentityObject, IdentityResolutionInput, IdentityResolutionResult, IdentitySignal } from "./types";

function groupSignals(signals: IdentitySignal[]): IdentitySignal[][] {
  const groups: IdentitySignal[][] = [];
  for (const signal of signals) {
    const matches = groups.filter((group) => group.some((other) => shouldLink(signal, other)));
    if (matches.length === 0) groups.push([signal]);
    else {
      matches[0].push(signal);
      for (const extra of matches.slice(1)) { matches[0].push(...extra); groups.splice(groups.indexOf(extra), 1); }
    }
  }
  return groups;
}

function contradictionsForGroup(signals: IdentitySignal[]): IdentityContradiction[] {
  const byType = (type: IdentitySignal["type"]) => uniqueSorted(signals.filter((s) => s.type === type).map((s) => s.normalizedValue));
  const refs = uniqueSorted(signals.map((s) => s.evidenceRef));
  const contradictions: IdentityContradiction[] = [];
  const add = (type: IdentityContradiction["type"], severity: IdentityContradiction["severity"], values: string[]) => contradictions.push({ id: `contradiction_${identityId(type + values.join("_"))}`, type, severity, values, evidenceRefs: refs, message: `${type}: ${values.join(" vs ")}` });
  const names = byType("business_name");
  if (names.length > 1) add("Business names differ", "medium", names);
  const phones = byType("phone");
  if (phones.length > 1) add("Phone belongs elsewhere", "high", phones);
  const emails = byType("email");
  if (emails.length > 1) add("Email mismatch", "high", emails);
  const socials = byType("social_profile");
  if (socials.length > 1) add("Social profile mismatch", "medium", socials);
  const domains = uniqueSorted([...byType("domain"), ...byType("website")]);
  if (domains.length > 2) add("Domain mismatch", "medium", domains);
  const marketplaces = byType("marketplace_account");
  if (marketplaces.length > 1) add("Marketplace alias mismatch", "low", marketplaces);
  const payments = byType("payment_account");
  if (payments.length > 1) add("Payment account mismatch", "high", payments);
  return contradictions;
}

function buildGraph(identities: IdentityObject[], signals: IdentitySignal[]): IdentityGraph {
  const nodes: IdentityGraph["nodes"] = [];
  const edges: IdentityGraph["edges"] = [];
  for (const identity of identities) {
    nodes.push({ id: identity.identityId, type: "Identity", label: identity.displayName });
    for (const ref of identity.evidenceRefs) {
      nodes.push({ id: ref, type: "Evidence", label: ref });
      edges.push({ from: identity.identityId, to: ref, type: "SUPPORTED_BY" });
    }
    for (const signal of signals.filter((s) => identity.evidenceRefs.includes(s.evidenceRef))) {
      const id = `${signal.type}:${signal.normalizedValue}`;
      nodes.push({ id, type: signal.type, label: signal.value });
      edges.push({ from: identity.identityId, to: id, type: "HAS_SIGNAL" });
    }
    for (const contradiction of identity.contradictions) edges.push({ from: identity.identityId, to: contradiction.id, type: "CONTRADICTS" });
  }
  return { nodes: Array.from(new Map(nodes.map((n) => [n.id, n])).values()), edges };
}

export function resolveIdentities(input: IdentityResolutionInput): IdentityResolutionResult {
  const signals = extractIdentitySignals(input.evidenceItems);
  const identities = groupSignals(signals).map((group) => {
    const base = buildIdentity(group, contradictionsForGroup(group));
    const confidence = calculateIdentityConfidence(base);
    return { ...base, confidence: confidence.confidence, confidenceScore: confidence.score };
  }).sort((a, b) => b.confidenceScore - a.confidenceScore || a.identityId.localeCompare(b.identityId));
  return {
    identities,
    contradictions: identities.flatMap((identity) => identity.contradictions),
    graph: buildGraph(identities, signals),
    examples: identities.slice(0, 3),
    confidenceCalculations: identities.map((identity) => calculateIdentityConfidence(identity).calculation),
    knownLimitations: ["Uses normalized Evidence Items only; raw provider payloads are intentionally unsupported.", "Deterministic matching favors exact normalized identifiers and does not perform fuzzy brand matching.", "Shared infrastructure such as agencies, call centers, or marketplaces can require human review when contradictions are present."],
  };
}

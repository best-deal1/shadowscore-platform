const BUSINESS_IDENTITY_RESOLVER_VERSION = "business-identity-resolver-v1";

const VERIFIED_SOURCES = new Set(["government_registry", "official_business_registry", "registry", "kyb", "verified_marketplace"]);
const INFERRED_SOURCES = new Set(["target-classifier", "business-profile", "provider-evidence", "website-metadata", "marketplace-evidence", "ontology", "business-memory"]);

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function normalizeDomain(input) {
  const raw = normalizeValue(input).toLowerCase();
  if (!raw) return "";
  const emailDomain = raw.match(/^[^\s@]+@([^\s@]+)$/)?.[1];
  const candidate = emailDomain ?? raw;
  return candidate
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function normalizeName(input) {
  return normalizeValue(input).replace(/\s+/g, " ");
}

function sourceKind(source) {
  if (VERIFIED_SOURCES.has(source)) return "externally_verified";
  if (source === "normalized-input") return "normalized_candidate";
  if (source === "temporary-domain") return "temporary";
  if (INFERRED_SOURCES.has(source)) return "inferred";
  return "inferred";
}

function emptyCandidate({ source, evidenceRef, confidence = 0.35 } = {}) {
  const kind = sourceKind(source ?? "normalized-input");
  return {
    kind,
    confidence,
    sources: source ? [source] : [],
    evidenceRefs: evidenceRef ? [evidenceRef] : [],
    aliases: [],
    emails: [],
    domains: [],
    marketplaceAccounts: [],
    verified: kind === "externally_verified",
    temporary: kind === "temporary",
    conflicts: [],
  };
}

function addUnique(list, value) {
  const normalized = normalizeValue(value);
  if (normalized && !list.includes(normalized)) list.push(normalized);
}

function addCandidate(candidates, partial, context = {}) {
  const candidate = { ...emptyCandidate(context), ...partial };
  candidate.domains = [...new Set((candidate.domains ?? []).map(normalizeDomain).filter(Boolean))];
  candidate.emails = [...new Set((candidate.emails ?? []).map((email) => normalizeValue(email).toLowerCase()).filter(Boolean))];
  candidate.aliases = [...new Set((candidate.aliases ?? []).map(normalizeName).filter(Boolean))];
  candidate.sources = [...new Set([...(candidate.sources ?? []), ...(context.source ? [context.source] : [])])];
  candidate.evidenceRefs = [...new Set([...(candidate.evidenceRefs ?? []), ...(context.evidenceRef ? [context.evidenceRef] : [])])];
  candidate.kind = partial.kind ?? sourceKind(context.source ?? candidate.sources[0] ?? "normalized-input");
  candidate.verified = candidate.kind === "externally_verified" || Boolean(candidate.verified);
  candidate.temporary = candidate.kind === "temporary" || Boolean(candidate.temporary);
  candidates.push(candidate);
}

function mergeCandidates(candidates) {
  const merged = [];
  for (const candidate of candidates) {
    const match = merged.find((item) => item.domains.some((domain) => candidate.domains.includes(domain)) || item.emails.some((email) => candidate.emails.includes(email)) || item.aliases.some((alias) => candidate.aliases.includes(alias)));
    if (!match) {
      merged.push({ ...candidate, conflicts: [...(candidate.conflicts ?? [])] });
      continue;
    }
    for (const field of ["domains", "emails", "aliases", "marketplaceAccounts", "sources", "evidenceRefs"]) {
      for (const value of candidate[field] ?? []) addUnique(match[field], value);
    }
    if (!match.legalName && candidate.legalName) match.legalName = candidate.legalName;
    if (match.legalName && candidate.legalName && match.legalName !== candidate.legalName) {
      match.conflicts.push({ field: "legalName", values: [match.legalName, candidate.legalName], sources: candidate.sources });
    }
    if (!match.displayName && candidate.displayName) match.displayName = candidate.displayName;
    match.confidence = Math.max(match.confidence, candidate.confidence);
    match.verified = match.verified || candidate.verified;
    match.temporary = match.temporary && candidate.temporary;
    match.kind = match.verified ? "externally_verified" : match.temporary ? "temporary" : match.kind === "normalized_candidate" ? candidate.kind : match.kind;
  }
  return merged;
}

function fromEvidenceObject(evidence, source, candidates) {
  if (!evidence || typeof evidence !== "object") return;
  const domain = normalizeDomain(evidence.domain ?? evidence.primaryDomain ?? evidence.website ?? evidence.url);
  const email = normalizeValue(evidence.email ?? evidence.contactEmail).toLowerCase();
  const legalName = normalizeName(evidence.legalName);
  const displayName = normalizeName(evidence.name ?? evidence.businessName ?? evidence.label);
  const alias = normalizeName(evidence.alias ?? evidence.sellerName ?? evidence.storeName);
  const marketplace = normalizeName(evidence.marketplaceAccount ?? evidence.sellerId ?? evidence.storeId);
  if (domain || email || legalName || displayName || alias || marketplace) {
    const evidenceSource = evidence.verified ? "registry" : source;
    addCandidate(candidates, {
      domains: domain ? [domain] : [],
      emails: email ? [email] : [],
      legalName: legalName || undefined,
      displayName: displayName || alias || undefined,
      aliases: [alias, displayName].filter(Boolean),
      marketplaceAccounts: marketplace ? [marketplace] : [],
      confidence: evidence.verified ? 0.9 : 0.62,
    }, { source: evidenceSource, evidenceRef: evidence.id });
  }
}

function resolveBusinessIdentity(input, options = {}) {
  const candidates = [];
  const target = typeof input === "string" ? input : input?.target;
  const normalizedDomain = normalizeDomain(target);
  const normalizedEmail = normalizeValue(target).includes("@") ? normalizeValue(target).toLowerCase() : "";

  if (normalizedDomain) {
    addCandidate(candidates, { domains: [normalizedDomain], emails: normalizedEmail ? [normalizedEmail] : [], confidence: 0.3 }, { source: "temporary-domain" });
  } else if (target) {
    addCandidate(candidates, { displayName: normalizeName(target), aliases: [normalizeName(target)], confidence: 0.25 }, { source: "normalized-input" });
  }

  for (const seed of options.seeds ?? []) fromEvidenceObject(seed, seed.verified ? "registry" : "explicit-seed", candidates);
  fromEvidenceObject(options.targetClassifier, "target-classifier", candidates);
  fromEvidenceObject(options.businessProfile, "business-profile", candidates);
  for (const item of options.providerEvidence ?? []) fromEvidenceObject(item, "provider-evidence", candidates);
  fromEvidenceObject(options.websiteMetadata, "website-metadata", candidates);
  for (const item of options.marketplaceEvidence ?? []) fromEvidenceObject(item, "marketplace-evidence", candidates);
  for (const entity of options.ontologyEntities ?? []) fromEvidenceObject({ id: entity.id, label: entity.label, name: entity.type === "BusinessEntity" ? entity.label : undefined, domain: entity.type === "Domain" ? entity.label : undefined, email: entity.type === "Email" ? entity.label : undefined }, "ontology", candidates);
  for (const record of options.businessMemoryRecords ?? []) fromEvidenceObject(record.identity ?? record, "business-memory", candidates);

  const merged = mergeCandidates(candidates);
  const primary = merged.find((candidate) => candidate.verified) ?? merged.find((candidate) => !candidate.temporary) ?? merged[0] ?? emptyCandidate({ source: "normalized-input" });
  return { resolverVersion: BUSINESS_IDENTITY_RESOLVER_VERSION, normalizedInput: { raw: normalizeValue(target), domain: normalizedDomain || undefined, email: normalizedEmail || undefined }, primaryIdentity: primary, candidates: merged, limitations: ["No company-specific identities are loaded by default.", "A domain-only input creates only a temporary candidate until external evidence is supplied.", "Legal names, ownership, emails and verified status require explicit evidence."] };
}

module.exports = { BUSINESS_IDENTITY_RESOLVER_VERSION, normalizeDomain, resolveBusinessIdentity };

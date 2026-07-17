const BUSINESS_IDENTITY_RESOLVER_VERSION = "private-business-identity-resolver-v7";

const CANONICAL_IDENTITY_TYPES = ["LegalEntity", "Organization", "Brand", "Domain", "Email", "Phone", "MarketplaceAccount", "RegulatoryRegistration", "License", "ExchangeListing", "GovernmentAuthority"];
const VERIFIED_RELATIONSHIP_TYPES = ["OWNED_BY", "OPERATED_BY", "REPRESENTS", "DISCLOSED_AS", "LICENSED_BY", "REGISTERED_WITH", "LISTED_ON", "USES_DOMAIN", "USES_EMAIL", "USES_PHONE", "OPERATES_ACCOUNT"];
const AUTHORITATIVE_STATUSES = new Set(["verified", "authoritative", "confirmed"]);
const ORGANIZATION_TYPES = new Set(["LegalEntity", "Organization"]);
const IDENTIFIER_RELATIONSHIPS = { Domain: "USES_DOMAIN", Email: "USES_EMAIL", Phone: "USES_PHONE", MarketplaceAccount: "OPERATES_ACCOUNT" };

function normalizeValue(value) { return String(value ?? "").trim(); }
function normalizeName(input) { return normalizeValue(input).replace(/\s+/g, " "); }
function slug(value) { return normalizeValue(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown"; }
function normalizeDomain(input) {
  const raw = normalizeValue(input).toLowerCase();
  if (!raw) return "";
  const emailDomain = raw.match(/^[^\s@]+@([^\s@]+)$/)?.[1];
  const candidate = emailDomain ?? raw;
  return candidate.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/\.$/, "");
}
function normalizeEmail(input) { const value = normalizeValue(input).toLowerCase(); return value.includes("@") ? value : ""; }
function now(options) { return options.observedAt || options.generatedAt || new Date().toISOString(); }
function confidenceForStatus(status) { return AUTHORITATIVE_STATUSES.has(status) ? 0.95 : status === "conflicting" ? 0.4 : 0.55; }
function nodeId(type, value) { return `${type}:${slug(value)}`; }
function relationshipId(type, from, to, evidenceRefs) { return `${type}:${slug(from)}:${slug(to)}:${slug((evidenceRefs || []).join("-"))}`; }

function makeNode(type, label, source, observedAt, attributes = {}) {
  return { id: nodeId(type, label), type, label: normalizeName(label), source, observedAt, attributes };
}
function makeRelationship(type, from, to, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes = {} }) {
  return { id: relationshipId(type, from, to, evidenceRefs), type, from, to, source, confidence, evidenceRefs: evidenceRefs || [], observedAt, verificationStatus, attributes };
}
function addNode(map, node) { if (node.label) map.set(node.id, { ...(map.get(node.id) || {}), ...node, attributes: { ...(map.get(node.id)?.attributes || {}), ...(node.attributes || {}) } }); return node.id; }
function addRelationship(list, relationship) { if (!list.some((item) => item.id === relationship.id)) list.push(relationship); }
function confidenceLabel(score) { return score >= 0.85 ? "High" : score >= 0.65 ? "Medium" : score > 0 ? "Low" : "Unknown"; }
function independentSources(relationships) { return [...new Set(relationships.map((rel) => rel.source).filter(Boolean))]; }
function evidenceCategory(evidence) {
  const source = normalizeValue(evidence.source).toLowerCase();
  const id = normalizeValue(evidence.id).toLowerCase();
  const explicit = normalizeValue(evidence.evidenceCategory || evidence.category || evidence.pageType || evidence.documentType).toLowerCase();
  const haystack = `${explicit} ${source} ${id}`;
  if (/sec|exchange|public-company|public_company/.test(haystack)) return "authoritative_public_company";
  if (/regulator|license|registry|registrar|vat|tax|business_registration/.test(haystack)) return "public_registry";
  if (/privacy/.test(haystack)) return "privacy_policy";
  if (/terms|tos|conditions/.test(haystack)) return "terms_of_service";
  if (/contact/.test(haystack)) return "contact_page";
  if (/about/.test(haystack)) return "about_page";
  if (/footer|copyright/.test(haystack)) return "footer";
  if (/schema|structured|json-ld|metadata/.test(haystack)) return "schema_org";
  if (/profile/.test(haystack)) return "business_profile";
  return "other";
}
function isAuthoritativeSingleSource(rel) { return AUTHORITATIVE_STATUSES.has(rel.verificationStatus) && /sec|exchange|regulator/i.test(`${rel.source || ""} ${rel.attributes?.evidenceCategory || ""}`); }
function supportedCanonical(graph, node) {
  const rels = graph.relationships.filter((rel) => rel.from === node.id || rel.to === node.id);
  const sources = independentSources(rels);
  const categories = [...new Set(rels.map((rel) => rel.attributes?.evidenceCategory).filter(Boolean))];
  const verified = rels.filter((rel) => AUTHORITATIVE_STATUSES.has(rel.verificationStatus));
  const singleAuthoritative = rels.some(isAuthoritativeSingleSource);
  return { rels, sources, categories, verified, singleAuthoritative, supported: singleAuthoritative || (sources.length >= 2 && verified.length >= 2) };
}
function missingPrivateEvidence(support) {
  const missing = [];
  if (support.sources.length < 2) missing.push("At least two independent evidence sources supporting the same organization identity.");
  if (support.verified.length < 2 && !support.singleAuthoritative) missing.push("At least two verified/corroborated identity relationships with provenance.");
  if (!support.categories.some((c)=>["privacy_policy","terms_of_service","about_page","contact_page","footer","schema_org","public_registry","business_profile"].includes(c))) missing.push("Business identity disclosures from About, Contact, Privacy, Terms, footer, schema.org, registry, or public business profile evidence.");
  return missing;
}
function attributeConfidence(graph, canonicalId, type, values) {
  const empty = { confidence: "Unknown", score: 0, evidenceRefs: [], sources: [], corroboratedByIndependentProviders: false, reasoning: "No evidence observed for this identity attribute." };
  if (!values.length) return empty;
  if (!canonicalId) return { ...empty, confidence: "Low", score: 0.3, reasoning: "Identifier was observed but no canonical organization corroborates it." };
  const rels = type === "SELF" ? graph.relationships.filter((rel) => rel.from === canonicalId || rel.to === canonicalId) : graph.relationships.filter((rel) => rel.from === canonicalId && rel.type === type);
  const canonicalNode = graph.nodes.get(canonicalId);
  const sources = independentSources(rels).concat(type === "SELF" && canonicalNode?.source ? [canonicalNode.source] : []).filter((value, index, all) => all.indexOf(value) === index);
  const verified = rels.filter((rel) => AUTHORITATIVE_STATUSES.has(rel.verificationStatus));
  const score = Math.min(0.98, Math.max(...rels.map((rel) => rel.confidence || 0.55), type === "SELF" ? 0.55 : 0) + (verified.length ? 0.15 : 0) + (sources.length > 1 ? 0.18 : 0));
  return { confidence: confidenceLabel(score), score: Number(score.toFixed(2)), evidenceRefs: [...new Set(rels.flatMap((rel) => rel.evidenceRefs || []))], sources, corroboratedByIndependentProviders: sources.length > 1, reasoning: sources.length > 1 ? "Multiple independent providers support this attribute." : verified.length ? "Verified provider relationship supports this attribute." : "Observed from a single unverified provider relationship." };
}
function identityAttributeConfidence(graph, canonicalId, primary) {
  return {
    legalName: attributeConfidence(graph, canonicalId, "SELF", primary.legalName ? [primary.legalName] : []),
    displayName: attributeConfidence(graph, canonicalId, "SELF", primary.displayName ? [primary.displayName] : []),
    aliases: attributeConfidence(graph, canonicalId, "REPRESENTS", primary.aliases),
    domains: attributeConfidence(graph, canonicalId, "USES_DOMAIN", primary.domains),
    emails: attributeConfidence(graph, canonicalId, "USES_EMAIL", primary.emails),
    phones: attributeConfidence(graph, canonicalId, "USES_PHONE", primary.phones),
    marketplaceAccounts: attributeConfidence(graph, canonicalId, "OPERATES_ACCOUNT", primary.marketplaceAccounts),
  };
}

function ingestEvidence(evidence, graph, options, fallbackSource = "submitted-evidence") {
  if (!evidence || typeof evidence !== "object") return;
  const source = normalizeValue(evidence.source) || fallbackSource;
  const observedAt = evidence.observedAt || now(options);
  const verificationStatus = evidence.verificationStatus || (evidence.verified ? "verified" : "unverified");
  const confidence = typeof evidence.confidence === "number" ? evidence.confidence : confidenceForStatus(verificationStatus);
  const evidenceRefs = evidence.evidenceRefs || [evidence.id || `${source}:${slug(evidence.legalName || evidence.name || evidence.domain || evidence.email || evidence.phone || evidence.marketplaceAccount || observedAt)}`];
  const legalName = normalizeName(evidence.legalName);
  const orgName = normalizeName(evidence.organizationName || evidence.businessName || evidence.name);
  const brandName = normalizeName(evidence.brandName || evidence.alias || evidence.storeName || evidence.sellerName);
  const orgType = legalName ? "LegalEntity" : orgName ? "Organization" : undefined;
  const orgLabel = legalName || orgName;
  let orgId;
  const category = evidenceCategory(evidence);
  if (orgType && orgLabel) orgId = addNode(graph.nodes, makeNode(orgType, orgLabel, source, observedAt, { country: evidence.country, industry: evidence.industry, evidenceCategory: category, businessRegistrationNumber: evidence.businessRegistrationNumber || evidence.registrationNumber, taxId: evidence.taxId || evidence.vatId, address: evidence.address }));
  if (brandName) {
    const brandId = addNode(graph.nodes, makeNode("Brand", brandName, source, observedAt));
    if (orgId) addRelationship(graph.relationships, makeRelationship("REPRESENTS", brandId, orgId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { evidenceCategory: category, relationship: "brand_to_operating_or_legal_entity" } }));
  }
  for (const [type, raw] of [["Domain", evidence.domain || evidence.primaryDomain || evidence.website || evidence.url], ["Email", evidence.email || evidence.contactEmail], ["Phone", evidence.phone || evidence.contactPhone], ["MarketplaceAccount", evidence.marketplaceAccount || evidence.sellerId || evidence.storeId]]) {
    const label = type === "Domain" ? normalizeDomain(raw) : type === "Email" ? normalizeEmail(raw) : normalizeName(raw);
    if (!label) continue;
    const identifierId = addNode(graph.nodes, makeNode(type, label, source, observedAt, { identifier: true }));
    if (orgId) addRelationship(graph.relationships, makeRelationship(IDENTIFIER_RELATIONSHIPS[type], orgId, identifierId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { evidenceCategory: category, relationship: type === "Domain" ? "operating_business_to_website" : "operating_business_to_contact_identifier" } }));
  }
  if (evidence.license || evidence.licenseNumber || evidence.regulatorName) {
    const authorityId = addNode(graph.nodes, makeNode("GovernmentAuthority", evidence.regulatorName || "Government Authority", source, observedAt));
    const licenseId = addNode(graph.nodes, makeNode("License", evidence.licenseNumber || evidence.license || `${orgLabel} license`, source, observedAt, { category: evidence.licenseCategory || evidence.industry }));
    if (orgId) addRelationship(graph.relationships, makeRelationship("LICENSED_BY", orgId, authorityId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { licenseId, category: evidence.licenseCategory || evidence.industry, evidenceCategory: category } }));
  }
  if (evidence.exchange || evidence.ticker) {
    const listingId = addNode(graph.nodes, makeNode("ExchangeListing", evidence.ticker || evidence.exchange, source, observedAt, { exchange: evidence.exchange }));
    if (orgId) addRelationship(graph.relationships, makeRelationship("LISTED_ON", orgId, listingId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { evidenceCategory: category } }));
  }
  if (evidence.ownerName && orgId) {
    const ownerId = addNode(graph.nodes, makeNode("Organization", evidence.ownerName, source, observedAt));
    addRelationship(graph.relationships, makeRelationship("OWNED_BY", ownerId, orgId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { evidenceCategory: category, relationship: "owner_to_operating_business" } }));
  }
}

function classifyCanonical(graph, canonicalId) {
  if (!canonicalId) return { beforeCanonicalResolution: "Identifier or evidence object only", afterCanonicalResolution: [], confidence: "Low", reasoning: "No canonical organization was resolved; regulated and public-company classes are not inferred." };
  const rels = graph.relationships.filter((rel) => rel.from === canonicalId && AUTHORITATIVE_STATUSES.has(rel.verificationStatus));
  const classes = [];
  if (rels.some((rel) => rel.type === "LICENSED_BY" && /bank|financial|finance|credit/i.test(`${rel.attributes?.category || ""} ${graph.nodes.get(rel.to)?.label || ""}`))) classes.push("Regulated Financial Institution");
  if (rels.some((rel) => rel.type === "LISTED_ON")) classes.push("Public Company");
  return { beforeCanonicalResolution: "Input-shape classification is retained only as observed-target context.", afterCanonicalResolution: classes, confidence: classes.length ? "High" : "Medium", reasoning: classes.length ? "Classes derive from verified relationships attached to the canonical organization." : "Canonical organization resolved, but no verified regulatory or exchange-listing relationship was present." };
}

function graphToJSON(graph) { return { nodes: [...graph.nodes.values()], relationships: graph.relationships }; }
function detectConflicts(graph) {
  const conflicts = [];
  for (const node of graph.nodes.values()) {
    if (!ORGANIZATION_TYPES.has(node.type)) continue;
    const ownership = graph.relationships.filter((rel) => rel.to === node.id && rel.type === "OWNED_BY");
    const owners = [...new Set(ownership.map((rel) => rel.from))];
    if (owners.length > 1) conflicts.push({ field: "ownership", severity: "high", organization: node.label, owners, evidenceRefs: ownership.flatMap((rel) => rel.evidenceRefs), message: "Multiple verified owners were observed for the same organization; do not silently choose one." });
  }
  const domainRelationships = graph.relationships.filter((rel) => rel.type === "USES_DOMAIN");
  const domainIds = [...new Set(domainRelationships.map((rel) => rel.to))];
  for (const domainId of domainIds) {
    const rels = domainRelationships.filter((rel) => rel.to === domainId);
    const organizationIds = [...new Set(rels.map((rel) => rel.from))];
    if (organizationIds.length > 1) conflicts.push({ field: "organization_identity", severity: "high", domain: graph.nodes.get(domainId)?.label, organizations: organizationIds.map((id) => graph.nodes.get(id)?.label).filter(Boolean), evidenceRefs: rels.flatMap((rel) => rel.evidenceRefs), message: "Independent providers name different organizations for the same domain; return conflict instead of choosing a winner." });
  }
  return conflicts;
}
function evidenceExplainabilityFor(attributeConfidence) {
  return Object.fromEntries(Object.entries(attributeConfidence).map(([attribute, confidence]) => [attribute, {
    confidence: confidence.confidence,
    score: confidence.score,
    why: confidence.reasoning,
    supportedBy: confidence.sources,
    evidenceRefs: confidence.evidenceRefs,
    notSupportedWhenEmpty: confidence.sources.length ? [] : ["No corroborating provider evidence observed."],
  }]));
}
function legacyPrimary(canonical, inputDomain, inputEmail, graph, unresolved, conflicts) {
  const organizationRels = canonical ? graph.relationships.filter((rel) => rel.from === canonical.id || rel.to === canonical.id) : [];
  const hasHighConflict = conflicts.some((conflict) => conflict.severity === "high");
  return { kind: unresolved || hasHighConflict ? "unknown" : "externally_verified", confidence: unresolved || hasHighConflict ? 0 : Math.max(...organizationRels.map((rel) => rel.confidence || 0.55), 0.55), legalName: !hasHighConflict && canonical?.type === "LegalEntity" ? canonical.label : undefined, displayName: hasHighConflict ? "Unknown" : canonical?.label || "Unknown", aliases: [...graph.nodes.values()].filter((n) => n.type === "Brand").map((n) => n.label), domains: [...graph.nodes.values()].filter((n) => n.type === "Domain").map((n) => n.label).concat(!unresolved && inputDomain && ![...graph.nodes.values()].some((n) => n.label === inputDomain) ? [inputDomain] : []), phones: [...graph.nodes.values()].filter((n) => n.type === "Phone").map((n) => n.label), emails: [...graph.nodes.values()].filter((n) => n.type === "Email").map((n) => n.label).concat(!unresolved && inputEmail && ![...graph.nodes.values()].some((n) => n.label === inputEmail) ? [inputEmail] : []), marketplaceAccounts: [...graph.nodes.values()].filter((n) => n.type === "MarketplaceAccount").map((n) => n.label), verified: !unresolved, temporary: unresolved, conflicts };
}

function nonPlaceholder(value) {
  const text = normalizeValue(value);
  return text && !/^(unavailable|not checked|insufficient public evidence)$/i.test(text) ? text : "";
}
function providerEvidenceToResolverEvidence(result) {
  if (!result || result.status !== "completed") return [];
  const metadataEvidence = result.metadata?.resolverEvidence ? [result.metadata.resolverEvidence] : [];
  const domain = normalizeDomain(result.metadata?.domain || result.evidence?.find((item)=>/domain|website/i.test(item.label))?.value);
  const observedAt = result.completedAt;
  const out = [...metadataEvidence];
  for (const item of result.evidence || []) {
    const value = nonPlaceholder(item.value);
    if (!value) continue;
    const label = normalizeValue(item.label).toLowerCase();
    const id = `${result.providerId}:${item.id}`;
    if (/legal company name|legal name|privacy.*entity|terms.*entity|copyright owner/.test(label)) {
      out.push({ id, legalName: value, domain, source: item.source || result.providerId, evidenceCategory: item.id.includes("privacy") ? "privacy_policy" : item.id.includes("terms") ? "terms_of_service" : item.id.includes("copyright") ? "footer" : "business_profile", verificationStatus: "verified", verified: true, evidenceRefs: [id], observedAt });
    } else if (/schema.*organization|business name|organization|profile title|site name/.test(label) && !/domain/.test(label)) {
      out.push({ id, organizationName: value, domain, source: item.source || result.providerId, evidenceCategory: item.id.includes("schema") ? "schema_org" : "business_profile", verificationStatus: "verified", verified: true, evidenceRefs: [id], observedAt });
    } else if (/exchange listing/.test(label)) {
      const existing = out.find((e)=>e.evidenceRefs?.includes(id.replace(/exchange$/, "legal-name")) || e.legalName);
      if (existing) existing.exchange = value;
    }
  }
  return out;
}
function providerResultEvidence(providerResults) {
  if (!Array.isArray(providerResults)) return [];
  return providerResults.flatMap(providerEvidenceToResolverEvidence).filter(Boolean);
}

function resolveBusinessIdentity(input, options = {}) {
  const target = typeof input === "string" ? input : input?.target;
  const normalizedDomain = normalizeDomain(target);
  const normalizedEmail = normalizeEmail(target);
  const graph = { nodes: new Map(), relationships: [] };
  const observedAt = now(options);
  if (normalizedEmail) addNode(graph.nodes, makeNode("Email", normalizedEmail, "normalized-input", observedAt, { identifier: true }));
  else if (normalizedDomain) addNode(graph.nodes, makeNode("Domain", normalizedDomain, "normalized-input", observedAt, { identifier: true }));
  const collectedEvidence = [
    ...(options.evidenceSources || []),
    ...(options.authoritativeCompanyEvidence || []),
    ...providerResultEvidence(options.providerResults),
    options.targetClassifier,
    options.businessProfile,
    ...(options.providerEvidence || []),
    options.websiteMetadata,
    ...(options.registryEvidence || []),
    ...(options.businessProfileEvidence || []),
    ...(options.structuredMetadataEvidence || []),
    ...(options.regulatoryEvidence || []),
    ...(options.marketplaceEvidence || []),
    ...(options.relationshipEvidence || []),
  ].filter(Boolean);
  for (const item of collectedEvidence) ingestEvidence(item, graph, options);
  const rawProviderEvidence = providerResultEvidence(options.providerResults);
  const candidateOrganizations = [...graph.nodes.values()].filter((node) => ORGANIZATION_TYPES.has(node.type)).map((node) => ({ node, support: supportedCanonical(graph, node), rejectionReasons: missingPrivateEvidence(supportedCanonical(graph, node)) }));
  const canonicalCandidate = candidateOrganizations.find((candidate) => candidate.support.supported) || null;
  const canonical = canonicalCandidate?.node;
  const conflicts = detectConflicts(graph);
  const unresolved = !canonical;
  const bestUnsupported = canonicalCandidate?.support || candidateOrganizations[0]?.support || { sources: [], verified: [], categories: [], singleAuthoritative: false };
  const missingEvidence = unresolved ? missingPrivateEvidence(bestUnsupported) : [];
  const classification = classifyCanonical(graph, canonical?.id);
  const canonicalGraph = graphToJSON(graph);
  const primaryIdentity = legacyPrimary(canonical, normalizedDomain, normalizedEmail, graph, unresolved, conflicts);
  const attributeConfidence = identityAttributeConfidence(graph, canonical?.id, primaryIdentity);
  const evidenceExplainability = evidenceExplainabilityFor(attributeConfidence);
  return { resolverVersion: BUSINESS_IDENTITY_RESOLVER_VERSION, canonicalIdentityTypes: CANONICAL_IDENTITY_TYPES, verifiedRelationshipTypes: VERIFIED_RELATIONSHIP_TYPES, normalizedInput: { raw: normalizeValue(target), domain: normalizedDomain || undefined, email: normalizedEmail || undefined }, canonicalOrganization: canonical ? { id: canonical.id, type: canonical.type, label: canonical.label } : null, identityResolutionStatus: conflicts.length ? "resolved_with_conflicts" : unresolved ? "unresolved" : "resolved", reviewStatus: unresolved || conflicts.length ? "REVIEW" : "PASS", identityConfidence: unresolved ? "Low" : conflicts.length ? "Low" : classification.confidence, canonicalIdentityGraph: canonicalGraph, identityResolutionFlow: ["Normalize submitted target into identifier evidence.", "Discover candidate legal entities from collected evidence sources; do not consult curated company fixtures or predefined organization catalogs.", "Load authoritative company evidence, website disclosures, registries, business profiles, structured metadata, regulatory records and submitted evidence as canonical identity nodes when present.", "Verify relationships with source, confidence, evidenceRefs, observedAt and verificationStatus.", "Resolve a canonical LegalEntity or Organization before entity classification.", unresolved ? "No canonical organization resolved; stop regulated/public-company inference." : "Classify from verified canonical relationships."], attributeConfidence, evidenceConfidence: attributeConfidence, evidenceExplainability, contradictions: conflicts, relationshipProvenance: canonicalGraph.relationships.map((rel) => ({ relationshipId: rel.id, type: rel.type, source: rel.source, confidence: rel.confidence, evidenceRefs: rel.evidenceRefs, observedAt: rel.observedAt, verificationStatus: rel.verificationStatus })), entityClassification: classification, missingEvidence, unresolvedIdentityBehavior: unresolved ? `Returns REVIEW with unresolved identity, low confidence, no inferred regulated or public-company class, and missing evidence: ${missingEvidence.join(" ") || "corroborating evidence"}` : undefined, primaryIdentity, candidates: candidateOrganizations.map((candidate) => ({ id: candidate.node.id, type: candidate.node.type, label: candidate.node.label, supported: candidate.support.supported, sources: candidate.support.sources, categories: candidate.support.categories, verifiedRelationshipCount: candidate.support.verified.length, singleAuthoritative: candidate.support.singleAuthoritative, rejectionReasons: candidate.support.supported ? [] : candidate.rejectionReasons })), resolverDiagnostics: { rawProviderEvidence, candidateOrganizations: candidateOrganizations.map((candidate) => ({ id: candidate.node.id, type: candidate.node.type, label: candidate.node.label, support: { sources: candidate.support.sources, categories: candidate.support.categories, verifiedRelationshipCount: candidate.support.verified.length, singleAuthoritative: candidate.support.singleAuthoritative, supported: candidate.support.supported }, rejectionReasons: candidate.support.supported ? [] : candidate.rejectionReasons })) }, limitations: ["Domains, emails, phones and marketplace accounts are identifiers or evidence objects, not the business itself.", "Unresolved inputs return Unknown identity labels; hostnames are not converted into organization names.", "Identity attributes carry their own evidence confidence and cross-provider corroboration metadata.", "Entity classification is derived only from the canonical organization and verified relationships.", "Predefined organization seeds are intentionally ignored; canonical legal identities must be discovered from collected evidence.", "Private business identity resolution requires multiple independent evidence sources unless a public-company exchange/SEC or regulator source is authoritative."] };
}

module.exports = { BUSINESS_IDENTITY_RESOLVER_VERSION, CANONICAL_IDENTITY_TYPES, VERIFIED_RELATIONSHIP_TYPES, normalizeDomain, resolveBusinessIdentity };

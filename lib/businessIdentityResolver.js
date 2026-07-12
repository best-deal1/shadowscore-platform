const BUSINESS_IDENTITY_RESOLVER_VERSION = "open-world-identity-resolver-v3";

const CANONICAL_IDENTITY_TYPES = ["LegalEntity", "Organization", "Brand", "Domain", "Email", "Phone", "MarketplaceAccount", "RegulatoryRegistration", "License", "ExchangeListing", "GovernmentAuthority"];
const VERIFIED_RELATIONSHIP_TYPES = ["OWNED_BY", "OPERATED_BY", "REPRESENTS", "LICENSED_BY", "REGISTERED_WITH", "LISTED_ON", "USES_DOMAIN", "USES_EMAIL", "USES_PHONE", "OPERATES_ACCOUNT"];
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
  if (orgType && orgLabel) orgId = addNode(graph.nodes, makeNode(orgType, orgLabel, source, observedAt, { country: evidence.country, industry: evidence.industry }));
  if (brandName) {
    const brandId = addNode(graph.nodes, makeNode("Brand", brandName, source, observedAt));
    if (orgId) addRelationship(graph.relationships, makeRelationship("REPRESENTS", brandId, orgId, { source, confidence, evidenceRefs, observedAt, verificationStatus }));
  }
  for (const [type, raw] of [["Domain", evidence.domain || evidence.primaryDomain || evidence.website || evidence.url], ["Email", evidence.email || evidence.contactEmail], ["Phone", evidence.phone || evidence.contactPhone], ["MarketplaceAccount", evidence.marketplaceAccount || evidence.sellerId || evidence.storeId]]) {
    const label = type === "Domain" ? normalizeDomain(raw) : type === "Email" ? normalizeEmail(raw) : normalizeName(raw);
    if (!label) continue;
    const identifierId = addNode(graph.nodes, makeNode(type, label, source, observedAt, { identifier: true }));
    if (orgId) addRelationship(graph.relationships, makeRelationship(IDENTIFIER_RELATIONSHIPS[type], orgId, identifierId, { source, confidence, evidenceRefs, observedAt, verificationStatus }));
  }
  if (evidence.license || evidence.licenseNumber || evidence.regulatorName) {
    const authorityId = addNode(graph.nodes, makeNode("GovernmentAuthority", evidence.regulatorName || "Government Authority", source, observedAt));
    const licenseId = addNode(graph.nodes, makeNode("License", evidence.licenseNumber || evidence.license || `${orgLabel} license`, source, observedAt, { category: evidence.licenseCategory || evidence.industry }));
    if (orgId) addRelationship(graph.relationships, makeRelationship("LICENSED_BY", orgId, authorityId, { source, confidence, evidenceRefs, observedAt, verificationStatus, attributes: { licenseId, category: evidence.licenseCategory || evidence.industry } }));
  }
  if (evidence.exchange || evidence.ticker) {
    const listingId = addNode(graph.nodes, makeNode("ExchangeListing", evidence.ticker || evidence.exchange, source, observedAt, { exchange: evidence.exchange }));
    if (orgId) addRelationship(graph.relationships, makeRelationship("LISTED_ON", orgId, listingId, { source, confidence, evidenceRefs, observedAt, verificationStatus }));
  }
  if (evidence.ownerName && orgId) {
    const ownerId = addNode(graph.nodes, makeNode("Organization", evidence.ownerName, source, observedAt));
    addRelationship(graph.relationships, makeRelationship("OWNED_BY", ownerId, orgId, { source, confidence, evidenceRefs, observedAt, verificationStatus }));
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
    if (owners.length > 1) conflicts.push({ field: "ownership", organization: node.label, owners, evidenceRefs: ownership.flatMap((rel) => rel.evidenceRefs) });
  }
  return conflicts;
}
function legacyPrimary(canonical, inputDomain, inputEmail, graph, unresolved, conflicts) {
  return { kind: unresolved ? "temporary" : "externally_verified", confidence: unresolved ? 0.3 : 0.95, legalName: canonical?.type === "LegalEntity" ? canonical.label : undefined, displayName: canonical?.label, aliases: [...graph.nodes.values()].filter((n) => n.type === "Brand").map((n) => n.label), domains: [...graph.nodes.values()].filter((n) => n.type === "Domain").map((n) => n.label).concat(inputDomain && ![...graph.nodes.values()].some((n) => n.label === inputDomain) ? [inputDomain] : []), emails: [...graph.nodes.values()].filter((n) => n.type === "Email").map((n) => n.label).concat(inputEmail && ![...graph.nodes.values()].some((n) => n.label === inputEmail) ? [inputEmail] : []), marketplaceAccounts: [...graph.nodes.values()].filter((n) => n.type === "MarketplaceAccount").map((n) => n.label), verified: !unresolved, temporary: unresolved, conflicts };
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
  const canonical = [...graph.nodes.values()].find((node) => ORGANIZATION_TYPES.has(node.type) && graph.relationships.some((rel) => rel.from === node.id && AUTHORITATIVE_STATUSES.has(rel.verificationStatus))) || [...graph.nodes.values()].find((node) => ORGANIZATION_TYPES.has(node.type));
  const conflicts = detectConflicts(graph);
  const unresolved = !canonical;
  const classification = classifyCanonical(graph, canonical?.id);
  const canonicalGraph = graphToJSON(graph);
  const primaryIdentity = legacyPrimary(canonical, normalizedDomain, normalizedEmail, graph, unresolved, conflicts);
  return { resolverVersion: BUSINESS_IDENTITY_RESOLVER_VERSION, canonicalIdentityTypes: CANONICAL_IDENTITY_TYPES, verifiedRelationshipTypes: VERIFIED_RELATIONSHIP_TYPES, normalizedInput: { raw: normalizeValue(target), domain: normalizedDomain || undefined, email: normalizedEmail || undefined }, canonicalOrganization: canonical ? { id: canonical.id, type: canonical.type, label: canonical.label } : null, identityResolutionStatus: unresolved ? "unresolved" : conflicts.length ? "resolved_with_conflicts" : "resolved", identityConfidence: unresolved ? "Low" : conflicts.length ? "Medium" : classification.confidence, canonicalIdentityGraph: canonicalGraph, identityResolutionFlow: ["Normalize submitted target into identifier evidence.", "Discover candidate legal entities from collected evidence sources; do not consult curated company fixtures or predefined organization catalogs.", "Load website disclosures, registries, business profiles, structured metadata, regulatory records and submitted evidence as canonical identity nodes when present.", "Verify relationships with source, confidence, evidenceRefs, observedAt and verificationStatus.", "Resolve a canonical LegalEntity or Organization before entity classification.", unresolved ? "No canonical organization resolved; stop regulated/public-company inference." : "Classify from verified canonical relationships."], relationshipProvenance: canonicalGraph.relationships.map((rel) => ({ relationshipId: rel.id, type: rel.type, source: rel.source, confidence: rel.confidence, evidenceRefs: rel.evidenceRefs, observedAt: rel.observedAt, verificationStatus: rel.verificationStatus })), entityClassification: classification, unresolvedIdentityBehavior: unresolved ? "Returns unresolved identity, low confidence, and no inferred regulated or public-company class." : undefined, primaryIdentity, candidates: [primaryIdentity], limitations: ["Domains, emails, phones and marketplace accounts are identifiers or evidence objects, not the business itself.", "Entity classification is derived only from the canonical organization and verified relationships.", "Predefined organization seeds are intentionally ignored; canonical legal identities must be discovered from collected evidence."] };
}

module.exports = { BUSINESS_IDENTITY_RESOLVER_VERSION, CANONICAL_IDENTITY_TYPES, VERIFIED_RELATIONSHIP_TYPES, normalizeDomain, resolveBusinessIdentity };

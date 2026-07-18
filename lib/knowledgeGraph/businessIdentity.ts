import type { BusinessIdentityIntelligenceResult } from "../businessIdentityIntelligence";
import type { BusinessProfile } from "../businessProfileEngine/types";
import type { KnowledgeEntityInput, KnowledgeRelationshipInput, KnowledgeScanInput } from "./types";

type BusinessIdentityKnowledgeInput = {
  scanId: string;
  target: string;
  businessProfile: BusinessProfile;
  identityIntelligence: BusinessIdentityIntelligenceResult;
  email?: string;
};

function addEntity(entities: KnowledgeEntityInput[], entity: KnowledgeEntityInput) {
  if (!entity.value.trim() || entities.some((item) => item.type === entity.type && item.value.toLowerCase() === entity.value.toLowerCase())) return;
  entities.push(entity);
}

/**
 * Converts the identity analysis into graph-native entities and relationships.
 * This deliberately preserves the source scan on every graph record so a later
 * investigation can use prior observations as context, not as unverified fact.
 */
export function buildBusinessIdentityKnowledgeScan(input: BusinessIdentityKnowledgeInput): KnowledgeScanInput {
  const { scanId, target, businessProfile, identityIntelligence, email } = input;
  const profile = identityIntelligence.businessProfile;
  const businessName = profile.company || businessProfile.businessName || target;
  const primaryDomain = businessProfile.primaryDomain || target;
  const entities: KnowledgeEntityInput[] = [];
  const relationships: KnowledgeRelationshipInput[] = [];
  const business = {
    type: "Business" as const,
    value: businessName,
    attributes: {
      identityConfidence: identityIntelligence.confidence,
      identityBasis: profile.identityBasis,
      country: profile.country || "unknown",
      industry: profile.industry || "unknown",
      yearsOperating: profile.yearsActive || 0,
    },
  };

  addEntity(entities, business);
  addEntity(entities, { type: "Domain", value: primaryDomain });
  relationships.push({ type: "OWNS", from: business, to: { type: "Domain", value: primaryDomain }, context: "Observed operating domain", sourceScanId: scanId });

  if (profile.legalEntity) {
    const legalEntity = { type: "Company" as const, value: profile.legalEntity };
    addEntity(entities, legalEntity);
    relationships.push({ type: "BELONGS_TO", from: business, to: legalEntity, context: "Legal entity identified in investigation", sourceScanId: scanId });
  }
  if (profile.parentCompany) {
    const parent = { type: "Company" as const, value: profile.parentCompany };
    addEntity(entities, parent);
    relationships.push({ type: "BELONGS_TO", from: business, to: parent, context: "Parent company identified in investigation", sourceScanId: scanId });
  }

  for (const evidence of identityIntelligence.findings.flatMap((finding) => finding.evidence)) {
    if (evidence.entityType === "email") {
      const contact = { type: "Email" as const, value: evidence.value };
      addEntity(entities, contact);
      relationships.push({ type: "HAS_EMAIL", from: business, to: contact, context: `${evidence.provenance.source}: ${evidence.provenance.label}`, sourceScanId: scanId });
    }
    if (evidence.entityType === "phone") {
      const contact = { type: "Phone" as const, value: evidence.value };
      addEntity(entities, contact);
      relationships.push({ type: "HAS_PHONE", from: business, to: contact, context: `${evidence.provenance.source}: ${evidence.provenance.label}`, sourceScanId: scanId });
    }
    if (evidence.entityType === "domain") {
      const domain = { type: "Domain" as const, value: evidence.value };
      addEntity(entities, domain);
      relationships.push({ type: "OWNS", from: business, to: domain, context: `${evidence.provenance.source}: ${evidence.provenance.label}`, sourceScanId: scanId });
    }
  }
  if (email) {
    const contact = { type: "Email" as const, value: email };
    addEntity(entities, contact);
    relationships.push({ type: "HAS_EMAIL", from: business, to: contact, context: "Investigation intake contact", sourceScanId: scanId });
  }

  return { scanId, entities, relationships };
}

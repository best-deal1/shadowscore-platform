export * from "./types";
export * from "./entities";
export * from "./relationships";
export * from "./events";
export * from "./mapper";

import { createOntologyEntity } from "./entities";
import { createOntologyRelationship } from "./relationships";
import type { OntologyGraph } from "./types";

const SAMPLE_CREATED_AT = "2026-01-01T00:00:00.000Z";

export const sampleDomainInvestigationOntology: OntologyGraph = (() => {
  const business = createOntologyEntity({ type: "BusinessEntity", label: "Example Commerce", source: "ontology-sample", confidence: 0.72, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["dns:example.com"] });
  const domain = createOntologyEntity({ type: "Domain", label: "example.com", source: "ontology-sample", confidence: 0.86, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["dns:example.com", "whois:example.com"] });
  return { entities: [business, domain], relationships: [createOntologyRelationship({ type: "USES", from: business.id, to: domain.id, source: "ontology-sample", confidence: 0.82, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["dns:example.com"] })] };
})();

export const sampleMarketplaceSellerOntology: OntologyGraph = (() => {
  const seller = createOntologyEntity({ type: "MarketplaceAccount", label: "amazon:example-store", source: "ontology-sample", confidence: 0.81, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["marketplace:storefront"] });
  const business = createOntologyEntity({ type: "BusinessEntity", label: "Example Store LLC", source: "ontology-sample", confidence: 0.67, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["marketplace:storefront"] });
  return { entities: [seller, business], relationships: [createOntologyRelationship({ type: "OPERATES_ON", from: business.id, to: seller.id, source: "ontology-sample", confidence: 0.76, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["marketplace:storefront"] })] };
})();

export const sampleEmailOnlyOntology: OntologyGraph = (() => {
  const email = createOntologyEntity({ type: "Email", label: "contact@example.com", source: "ontology-sample", confidence: 0.7, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["input:email"] });
  const domain = createOntologyEntity({ type: "Domain", label: "example.com", source: "ontology-sample", confidence: 0.62, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["input:email"] });
  return { entities: [email, domain], relationships: [createOntologyRelationship({ type: "LINKED_TO", from: email.id, to: domain.id, source: "ontology-sample", confidence: 0.62, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["input:email"] })] };
})();

export const sampleMissingOwnershipOntology: OntologyGraph = (() => {
  const business = createOntologyEntity({ type: "BusinessEntity", label: "Unverified Retailer", source: "ontology-sample", confidence: 0.48, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["profile:partial"] });
  const risk = createOntologyEntity({ type: "RiskSignal", label: "Missing ownership evidence", source: "ontology-sample", confidence: 0.84, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["profile:partial"] });
  const recommendation = createOntologyEntity({ type: "Recommendation", label: "Request registry or beneficial ownership documentation", source: "ontology-sample", confidence: 0.78, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["profile:partial"] });
  return { entities: [business, risk, recommendation], relationships: [createOntologyRelationship({ type: "TRIGGERED", from: risk.id, to: recommendation.id, source: "ontology-sample", confidence: 0.8, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["profile:partial"] })] };
})();

export const sampleFailedProviderOntology: OntologyGraph = (() => {
  const evidence = createOntologyEntity({ type: "EvidenceItem", label: "WHOIS provider timeout", source: "ontology-sample", confidence: 0.35, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["provider:whois"] });
  const risk = createOntologyEntity({ type: "RiskSignal", label: "Provider failed before ownership confirmation", source: "ontology-sample", confidence: 0.82, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["provider:whois"] });
  const outcome = createOntologyEntity({ type: "ObservedOutcome", label: "Evidence coverage downgraded", source: "ontology-sample", confidence: 0.74, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["provider:whois"] });
  return { entities: [evidence, risk, outcome], relationships: [createOntologyRelationship({ type: "RESULTED_IN", from: risk.id, to: outcome.id, source: "ontology-sample", confidence: 0.75, createdAt: SAMPLE_CREATED_AT, evidenceRefs: ["provider:whois"] })] };
})();

export const sampleOntologyOutputs = {
  domainInvestigation: sampleDomainInvestigationOntology,
  marketplaceSeller: sampleMarketplaceSellerOntology,
  emailOnlyInput: sampleEmailOnlyOntology,
  businessWithMissingOwnership: sampleMissingOwnershipOntology,
  businessWithFailedProvider: sampleFailedProviderOntology,
} as const;

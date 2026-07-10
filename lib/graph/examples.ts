import type { Investigation } from "../investigation/types";
import type { OntologyEntity, OntologyRelationship } from "../ontology/types";
import { buildKnowledgeGraph } from "./builder";
import type { KnowledgeGraph } from "./types";

const CREATED_AT = "2026-01-01T00:00:00.000Z";

export type GraphExampleName = "domain" | "email" | "seller" | "business" | "multiEvidence";

export function buildGraphExamples(): Record<GraphExampleName, KnowledgeGraph> {
  return {
    domain: buildKnowledgeGraph(exampleInvestigation("domain", "Website", "example.com", [domain("example.com")], [])),
    email: buildKnowledgeGraph(exampleInvestigation("email", "Email", "support@example.com", [email("support@example.com")], [])),
    seller: buildKnowledgeGraph(exampleInvestigation("seller", "Marketplace Seller", "marketplace:seller-42", [seller("seller-42")], [])),
    business: buildKnowledgeGraph(exampleInvestigation("business", "Business", "Example Co", [business("Example Co"), domain("example.com")], [rel("businessentity:example-co", "domain:example-com", "USES")])),
    multiEvidence: buildKnowledgeGraph(exampleInvestigation("multi-evidence", "Business", "Example Co", [
      business("Example Co", ["ev-domain", "ev-email"]),
      domain("example.com", ["ev-domain"]),
      email("support@example.com", ["ev-email"]),
      evidence("Domain registration", "ev-domain"),
      evidence("Support inbox", "ev-email"),
      risk("Newly registered domain", ["ev-domain"]),
    ], [
      rel("businessentity:example-co", "domain:example-com", "USES", ["ev-domain"]),
      rel("businessentity:example-co", "email:support-example-com", "CONTACTED_BY", ["ev-email"]),
    ])),
  };
}

function exampleInvestigation(id: string, targetType: Investigation["targetType"], target: string, entities: OntologyEntity[], relationships: OntologyRelationship[]): Investigation {
  return {
    investigationId: `graph-example-${id}`,
    target,
    normalizedTarget: target.toLowerCase(),
    targetType,
    status: "ready",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ontologyGraph: { entities, relationships },
    evidenceRefs: entities.flatMap((entity) => entity.evidenceRefs),
    decision: null,
    technicalStatus: { executed: [], failed: [], pending: [], skipped: [] },
    outcome: "unresolved",
  };
}

function business(label: string, evidenceRefs: string[] = []): OntologyEntity { return entity("BusinessEntity", label, evidenceRefs); }
function domain(label: string, evidenceRefs: string[] = []): OntologyEntity { return entity("Domain", label, evidenceRefs); }
function email(label: string, evidenceRefs: string[] = []): OntologyEntity { return entity("Email", label, evidenceRefs); }
function seller(label: string, evidenceRefs: string[] = []): OntologyEntity { return entity("MarketplaceAccount", label, evidenceRefs); }
function evidence(label: string, evidenceRef: string): OntologyEntity { return entity("EvidenceItem", label, [evidenceRef]); }
function risk(label: string, evidenceRefs: string[]): OntologyEntity { return entity("RiskSignal", label, evidenceRefs); }

function entity(type: OntologyEntity["type"], label: string, evidenceRefs: string[]): OntologyEntity {
  return { id: `${type.toLowerCase()}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`, type, label, source: "ontology-sample", confidence: 0.8, createdAt: CREATED_AT, evidenceRefs } as OntologyEntity;
}

function rel(from: string, to: string, type: OntologyRelationship["type"], evidenceRefs: string[] = []): OntologyRelationship {
  return { id: `${from}-${type}-${to}`, type, from, to, label: type, source: "ontology-sample", confidence: 0.75, createdAt: CREATED_AT, evidenceRefs };
}

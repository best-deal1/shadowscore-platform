import type { BusinessProfile } from "../businessProfileEngine/types";
import type { BusinessMemoryResult } from "../businessMemory/types";
import type { DecisionIntelligenceOutput } from "../decisionEngine/types";
import type { DecisionOutput } from "../decisionEngine";
import type { KnowledgeGraphSnapshot } from "../knowledgeGraph/types";
import type { BusinessNarrative } from "../narrative/types";
import type { ProviderResult } from "../providers/types";
import type { TargetClassificationResult } from "../targetClassifier/types";
import { createOntologyEntity } from "./entities";
import { createOntologyRelationship } from "./relationships";
import type { OntologyEntity, OntologyGraph, OntologyRelationship } from "./types";

const DEFAULT_CREATED_AT = "1970-01-01T00:00:00.000Z";

type EntityBag = Map<string, OntologyEntity>;
type RelationshipBag = Map<string, OntologyRelationship>;

export type OntologyMapperInput = {
  targetClassification?: TargetClassificationResult;
  businessIdentity?: BusinessProfile;
  decisionModel?: DecisionIntelligenceOutput | DecisionOutput;
  knowledgeGraph?: KnowledgeGraphSnapshot;
  businessMemory?: BusinessMemoryResult;
  providerEvidence?: ProviderResult[];
  narrative?: BusinessNarrative;
  createdAt?: string;
};

export function mapToOntology(input: OntologyMapperInput): OntologyGraph {
  const entities: EntityBag = new Map();
  const relationships: RelationshipBag = new Map();
  const createdAt = input.createdAt ?? DEFAULT_CREATED_AT;

  addGraph(entities, relationships, mapTargetClassification(input.targetClassification, createdAt));
  addGraph(entities, relationships, mapBusinessIdentity(input.businessIdentity, createdAt));
  addGraph(entities, relationships, mapDecisionModel(input.decisionModel, createdAt));
  addGraph(entities, relationships, mapKnowledgeGraph(input.knowledgeGraph, createdAt));
  addGraph(entities, relationships, mapBusinessMemory(input.businessMemory, createdAt));
  addGraph(entities, relationships, mapProviderEvidence(input.providerEvidence, createdAt));
  addGraph(entities, relationships, mapNarrative(input.narrative, createdAt));

  return { entities: [...entities.values()], relationships: [...relationships.values()] };
}

export function mapTargetClassification(result?: TargetClassificationResult, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!result) return emptyGraph();
  const target = entityForClassifiedTarget(result, createdAt);
  const entities = [target];
  const relationships: OntologyRelationship[] = [];

  for (const identifier of result.extractedIdentifiers) {
    const mapped = createOntologyEntity({
      type: identifier.kind === "email" ? "Email" : identifier.kind === "phone" ? "Phone" : identifier.kind === "domain" || identifier.kind === "url" ? "Domain" : identifier.kind === "seller" || identifier.kind === "store" ? "MarketplaceAccount" : "EvidenceItem",
      label: identifier.value,
      source: "target-classification",
      confidence: result.confidence,
      createdAt,
      evidenceRefs: [],
      attributes: { kind: identifier.kind, label: identifier.label },
    });
    entities.push(mapped);
    relationships.push(createOntologyRelationship({ type: "LINKED_TO", from: target.id, to: mapped.id, source: "target-classification", confidence: result.confidence, createdAt }));
  }

  return { entities, relationships };
}

export function mapBusinessIdentity(profile?: BusinessProfile, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!profile) return emptyGraph();
  const evidenceRefs = profile.evidenceItems.map((item) => item.id);
  const business = createOntologyEntity({ type: "BusinessEntity", label: profile.businessName, source: "business-identity", confidence: confidenceLevel(profile.identityConfidence), createdAt, evidenceRefs, attributes: { businessType: profile.businessType, country: profile.country, coverage: profile.investigationCoverage } });
  const domain = createOntologyEntity({ type: "Domain", label: profile.primaryDomain, source: "business-identity", confidence: confidenceLevel(profile.infrastructureConfidence), createdAt, evidenceRefs });
  const entities: OntologyEntity[] = [business, domain];
  const relationships = [createOntologyRelationship({ type: "USES", from: business.id, to: domain.id, source: "business-identity", confidence: confidenceLevel(profile.infrastructureConfidence), createdAt, evidenceRefs })];

  for (const evidence of profile.evidenceItems) {
    entities.push(createOntologyEntity({ type: "EvidenceItem", label: evidence.label, source: "business-identity", confidence: confidenceLevel(evidence.confidence), createdAt: evidence.observedAt ?? createdAt, evidenceRefs: [evidence.id], attributes: { evidenceType: evidence.type, value: evidence.value, reliability: evidence.reliability } }));
  }
  for (const signal of profile.warningSignals) entities.push(createOntologyEntity({ type: "RiskSignal", label: signal, source: "business-identity", confidence: 0.68, createdAt, evidenceRefs }));
  if (profile.recommendedNextStep) entities.push(createOntologyEntity({ type: "Recommendation", label: profile.recommendedNextStep, source: "business-identity", confidence: 0.78, createdAt, evidenceRefs }));
  return { entities, relationships };
}

export function mapDecisionModel(decision?: DecisionIntelligenceOutput | DecisionOutput, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!decision) return emptyGraph();
  const recommendation = "recommendation" in decision ? decision.recommendation : decision.recommendedAction;
  const decisionLabel = "decisionLabel" in decision ? decision.decisionLabel : decision.decision;
  const attributes = "evidenceCoverage" in decision ? { coverage: decision.evidenceCoverage } : undefined;
  return { entities: [
    createOntologyEntity({ type: "ObservedOutcome", label: decisionLabel, source: "decision-model", confidence: confidenceFromDecision(decision), createdAt, evidenceRefs: [], ...(attributes ? { attributes } : {}) }),
    createOntologyEntity({ type: "Recommendation", label: recommendation, source: "decision-model", confidence: confidenceFromDecision(decision), createdAt, evidenceRefs: [] }),
  ], relationships: [] };
}

export function mapKnowledgeGraph(graph?: KnowledgeGraphSnapshot, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!graph) return emptyGraph();
  const entities = graph.entities.map((entity) => createOntologyEntity({ type: knowledgeType(entity.type), label: entity.label, source: "knowledge-graph", confidence: 0.75, createdAt, evidenceRefs: entity.sourceScanIds, attributes: entity.attributes }));
  const relationships = graph.relationships.map((rel) => createOntologyRelationship({ type: knowledgeRelationshipType(rel.type), from: rel.from, to: rel.to, source: "knowledge-graph", confidence: 0.72, createdAt, evidenceRefs: rel.sourceScanIds, label: rel.context }));
  return { entities, relationships };
}

export function mapBusinessMemory(memory?: BusinessMemoryResult, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!memory) return emptyGraph();
  return { entities: memory.detectedChanges.map((change) => createOntologyEntity({ type: "ObservedOutcome", label: change.summary, source: "business-memory", confidence: 0.74, createdAt, evidenceRefs: [memory.latestSnapshot.id], attributes: { changeType: change.type, field: change.field, stabilityLevel: memory.stabilityLevel } })), relationships: [] };
}

export function mapProviderEvidence(results?: ProviderResult[], createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!results?.length) return emptyGraph();
  const entities: OntologyEntity[] = [];
  for (const result of results) {
    for (const evidence of result.evidence) entities.push(createOntologyEntity({ type: "EvidenceItem", label: evidence.label, source: "provider-evidence", confidence: result.status === "completed" ? 0.8 : 0.35, createdAt: result.completedAt || createdAt, evidenceRefs: [evidence.id], attributes: { providerId: result.providerId, evidenceType: evidence.type, ...(evidence.value ? { value: evidence.value } : {}) } }));
    for (const error of result.errors) entities.push(createOntologyEntity({ type: "RiskSignal", label: `${result.providerId} failed: ${error}`, source: "provider-evidence", confidence: 0.82, createdAt: result.completedAt || createdAt, evidenceRefs: [] }));
  }
  return { entities, relationships: [] };
}

export function mapNarrative(narrative?: BusinessNarrative, createdAt = DEFAULT_CREATED_AT): OntologyGraph {
  if (!narrative) return emptyGraph();
  return { entities: narrative.sections.map((section) => createOntologyEntity({ type: section.id === "recommendedNextSteps" ? "Recommendation" : "EvidenceItem", label: section.title, source: "narrative", confidence: 0.66, createdAt: narrative.generatedAt || createdAt, evidenceRefs: [], attributes: { body: section.body } })), relationships: [] };
}

function addGraph(entities: EntityBag, relationships: RelationshipBag, graph: OntologyGraph): void {
  for (const entity of graph.entities) entities.set(entity.id, entity);
  for (const relationship of graph.relationships) relationships.set(relationship.id, relationship);
}
function emptyGraph(): OntologyGraph { return { entities: [], relationships: [] }; }
function confidenceLevel(level: string): number { return level === "High" ? 0.9 : level === "Medium" ? 0.65 : level === "Low" ? 0.4 : 0.2; }
function confidenceFromDecision(decision: DecisionIntelligenceOutput | DecisionOutput): number { return "confidenceLevel" in decision ? confidenceLevel(decision.confidenceLevel) : 0.6; }
function entityForClassifiedTarget(result: TargetClassificationResult, createdAt: string): OntologyEntity { return createOntologyEntity({ type: result.targetType === "Email" ? "Email" : result.targetType === "Phone" ? "Phone" : result.targetType.includes("Marketplace") ? "MarketplaceAccount" : result.targetType === "Website" ? "Domain" : "BusinessEntity", label: result.normalizedTarget, source: "target-classification", confidence: result.confidence, createdAt, evidenceRefs: [], attributes: { targetType: result.targetType, platform: result.detectedPlatform, reasoning: result.reasoning } }); }
function knowledgeType(type: string): OntologyEntity["type"] { return type === "Marketplace Seller" || type === "Marketplace Store" ? "MarketplaceAccount" : type === "Business" || type === "Company" || type === "Brand" ? "BusinessEntity" : type === "Social Profile" ? "EvidenceItem" : type as OntologyEntity["type"]; }
function knowledgeRelationshipType(type: string) { return type === "HAS_EMAIL" ? "CONTACTED_BY" : type === "HAS_PHONE" ? "CONTACTED_BY" : type === "BELONGS_TO" ? "OWNS" : type === "SHARES_IDENTITY_WITH" ? "LINKED_TO" : type as OntologyRelationship["type"]; }

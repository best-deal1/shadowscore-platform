export type OntologyEntityType =
  | "BusinessEntity"
  | "Domain"
  | "Email"
  | "Phone"
  | "MarketplaceAccount"
  | "PaymentAccount"
  | "Supplier"
  | "RiskSignal"
  | "EvidenceItem"
  | "EnforcementEvent"
  | "Recommendation"
  | "ObservedOutcome";

export type OntologyRelationshipType =
  | "OWNS"
  | "USES"
  | "OPERATES_ON"
  | "CONTACTED_BY"
  | "SUPPLIED_BY"
  | "LINKED_TO"
  | "TRIGGERED"
  | "RECOMMENDED_ACTION"
  | "RESULTED_IN";

export type OntologySource =
  | "target-classification"
  | "business-identity"
  | "decision-model"
  | "knowledge-graph"
  | "business-memory"
  | "provider-evidence"
  | "narrative"
  | "ontology-sample";

export type OntologyConfidence = number;

export type OntologyPrimitive = string | number | boolean | null;

export type OntologyAttributes = Record<string, OntologyPrimitive | OntologyPrimitive[]>;

export interface OntologyObjectBase {
  id: string;
  type: OntologyEntityType;
  label: string;
  source: OntologySource | string;
  confidence: OntologyConfidence;
  createdAt: string;
  evidenceRefs: string[];
  attributes?: OntologyAttributes;
}

export type BusinessEntity = OntologyObjectBase & { type: "BusinessEntity" };
export type Domain = OntologyObjectBase & { type: "Domain" };
export type Email = OntologyObjectBase & { type: "Email" };
export type Phone = OntologyObjectBase & { type: "Phone" };
export type MarketplaceAccount = OntologyObjectBase & { type: "MarketplaceAccount" };
export type PaymentAccount = OntologyObjectBase & { type: "PaymentAccount" };
export type Supplier = OntologyObjectBase & { type: "Supplier" };
export type RiskSignal = OntologyObjectBase & { type: "RiskSignal" };
export type EvidenceItem = OntologyObjectBase & { type: "EvidenceItem" };
export type EnforcementEvent = OntologyObjectBase & { type: "EnforcementEvent" };
export type Recommendation = OntologyObjectBase & { type: "Recommendation" };
export type ObservedOutcome = OntologyObjectBase & { type: "ObservedOutcome" };

export type OntologyEntity =
  | BusinessEntity
  | Domain
  | Email
  | Phone
  | MarketplaceAccount
  | PaymentAccount
  | Supplier
  | RiskSignal
  | EvidenceItem
  | EnforcementEvent
  | Recommendation
  | ObservedOutcome;

export interface OntologyRelationship {
  id: string;
  type: OntologyRelationshipType;
  from: string;
  to: string;
  label: string;
  source: OntologySource | string;
  confidence: OntologyConfidence;
  createdAt: string;
  evidenceRefs: string[];
  attributes?: OntologyAttributes;
}

export interface OntologyGraph {
  entities: OntologyEntity[];
  relationships: OntologyRelationship[];
}

export type KnowledgeEntityType =
  | "Business"
  | "Domain"
  | "Email"
  | "Phone"
  | "Marketplace Seller"
  | "Marketplace Store"
  | "Brand"
  | "Company"
  | "Social Profile";

export type KnowledgeRelationshipType =
  | "OWNS"
  | "USES"
  | "BELONGS_TO"
  | "HAS_EMAIL"
  | "HAS_PHONE"
  | "OPERATES_ON"
  | "SHARES_IDENTITY_WITH"
  | "LINKED_TO";

export type KnowledgeEntityInput = {
  type: KnowledgeEntityType;
  value: string;
  label?: string;
  aliases?: string[];
  attributes?: Record<string, string | number | boolean>;
  sourceScanId?: string;
};

export type KnowledgeRelationshipInput = {
  type: KnowledgeRelationshipType;
  from: KnowledgeEntityInput | string;
  to: KnowledgeEntityInput | string;
  context?: string;
  sourceScanId?: string;
};

export type KnowledgeScanInput = {
  scanId: string;
  entities?: KnowledgeEntityInput[];
  relationships?: KnowledgeRelationshipInput[];
};

export type KnowledgeEntity = {
  id: string;
  type: KnowledgeEntityType;
  label: string;
  normalizedValue: string;
  aliases: string[];
  attributes: Record<string, string | number | boolean>;
  sourceScanIds: string[];
};

export type KnowledgeRelationship = {
  id: string;
  type: KnowledgeRelationshipType;
  from: string;
  to: string;
  context?: string;
  sourceScanIds: string[];
};

export type KnowledgeGraphSummary = {
  entityCount: number;
  relationshipCount: number;
  entityTypes: Record<KnowledgeEntityType, number>;
  relationshipTypes: Record<KnowledgeRelationshipType, number>;
};

export type KnowledgeScanResult = {
  entitiesCreated: KnowledgeEntity[];
  entitiesUpdated: KnowledgeEntity[];
  relationshipsCreated: KnowledgeRelationship[];
  linkedEntities: KnowledgeEntity[];
  graphSummary: KnowledgeGraphSummary;
};

export type KnowledgeGraphSnapshot = {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  graphSummary: KnowledgeGraphSummary;
};

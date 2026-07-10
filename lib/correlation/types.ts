import type { EvidenceItem } from "../evidence";

export type CorrelationClassification = "Confirmed" | "Likely" | "Unknown" | "Contradiction";

export type RelationshipKind =
  | "business_registry"
  | "email_domain_website"
  | "phone_business"
  | "dns_ssl"
  | "company_name_consistency"
  | "marketplace_seller_company"
  | "payment_account_entity"
  | "fraud_reputation";

export type CorrelationEndpoint = {
  role: string;
  value: string;
  evidenceId: string;
  source: string;
};

export type CorrelationContradiction = {
  id: string;
  relationship: RelationshipKind;
  title: string;
  classification: "Contradiction";
  severity: "medium" | "high" | "critical";
  explanation: string;
  evidence: CorrelationEndpoint[];
};

export type CorrelationFinding = {
  id: string;
  relationship: RelationshipKind;
  title: string;
  classification: CorrelationClassification;
  confidence: number;
  explanation: string;
  evidence: CorrelationEndpoint[];
  contradiction?: CorrelationContradiction;
};

export type CorrelationSummary = {
  engineVersion: string;
  generatedAt: string;
  findings: CorrelationFinding[];
  verifiedRelationships: CorrelationFinding[];
  missingRelationships: CorrelationFinding[];
  contradictions: CorrelationContradiction[];
  unresolvedRelationships: CorrelationFinding[];
  counts: Record<CorrelationClassification, number>;
};

export type CorrelationInput = {
  evidenceItems: EvidenceItem[];
  generatedAt?: string;
};

export type EvidenceFacts = {
  businessNames: CorrelationEndpoint[];
  registryNames: CorrelationEndpoint[];
  domains: CorrelationEndpoint[];
  websites: CorrelationEndpoint[];
  emails: CorrelationEndpoint[];
  phones: CorrelationEndpoint[];
  dnsHosts: CorrelationEndpoint[];
  sslHosts: CorrelationEndpoint[];
  marketplaceSellers: CorrelationEndpoint[];
  paymentAccounts: CorrelationEndpoint[];
  fraudSignals: CorrelationEndpoint[];
  negativeSignals: CorrelationEndpoint[];
};

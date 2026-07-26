import type { TrustPolicy } from "./types";

export const DEFAULT_TRUST_POLICY: TrustPolicy = {
  version: "trust-policy@1.0.0", missingBaseline: 50, alertDropThreshold: 8,
  dimensionWeights: { identity:.16, operational:.12, financial:.12, compliance:.16, marketplace:.1, cyber:.1, reputation:.08, relationships:.08, evidenceQuality:.08 },
  factorWeights: {
    identity:{verified_identifier:1.5,registration_validity:1.4,company_age:.7,aliases:.5,legal_history:1.1},
    operational:{website_uptime:1.2,contact_consistency:1,response_quality:.8,support_availability:.7},
    financial:{payment_history:1.2,solvency:1.3,fraud_exposure:1.5},
    compliance:{sanctions:2,aml:1.6,licenses:1.2,regulatory_findings:1.5},
    marketplace:{seller_history:1,dispute_ratio:1.3,return_ratio:.8,delivery_history:1,suspension_history:1.6},
    cyber:{tls:1,dns:.7,email_authentication:1.2,domain_age:.7,exposed_services:1.3},
    reputation:{verified_reviews:1,adverse_media:1.4,complaint_pattern:1.2},
    relationships:{beneficial_owners:1.2,directors:1.1,subsidiaries:.8,suppliers:.7,shared_infrastructure:1.3},
    evidenceQuality:{freshness:1.2,source_reliability:1.3,corroboration:1.2,contradictions:1.4},
  },
};

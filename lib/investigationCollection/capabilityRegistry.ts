import type { InvestigationInputKind } from "../investigationEngine/types";
import type { InvestigationProviderManifest } from "./types";

export type ProviderCapabilityRegistration = {
  id: string;
  capability: NonNullable<InvestigationProviderManifest["capabilities"]>[number];
  targetTypes: InvestigationInputKind[];
  credentialEnv?: string;
  legalBasis: InvestigationProviderManifest["legalBasis"];
};

/** Integration contracts. An absent credential means unavailable, never synthetic data. */
export const PROVIDER_CAPABILITY_REGISTRY: ProviderCapabilityRegistration[] = [
  { id: "public-social-discovery", capability: "social", targetTypes: ["email", "person", "username", "social_profile"], credentialEnv: "BRAVE_SEARCH_API_KEY", legalBasis: "licensed" },
  { id: "phone-intelligence", capability: "phone", targetTypes: ["phone"], credentialEnv: "PHONE_INTELLIGENCE_API_KEY", legalBasis: "licensed" },
  { id: "sec-edgar-company-registry", capability: "registry", targetTypes: ["company", "legal_entity", "registration_number"], legalBasis: "open_data" },
  { id: "commercial-business-information", capability: "business", targetTypes: ["company", "legal_entity", "domain"], credentialEnv: "BUSINESS_INFORMATION_API_KEY", legalBasis: "licensed" },
  { id: "domain-history", capability: "domain_history", targetTypes: ["domain"], credentialEnv: "DOMAIN_HISTORY_API_KEY", legalBasis: "licensed" },
  { id: "regulatory-public-records", capability: "regulatory", targetTypes: ["person", "company", "legal_entity", "address"], credentialEnv: "REGULATORY_RECORDS_API_KEY", legalBasis: "open_data" },
  { id: "reputation", capability: "reputation", targetTypes: ["email", "phone", "domain", "username", "social_profile"], credentialEnv: "REPUTATION_API_KEY", legalBasis: "licensed" },
  { id: "marketplace-partner", capability: "marketplace", targetTypes: ["marketplace_identity", "email", "phone"], credentialEnv: "MARKETPLACE_PARTNER_API_KEY", legalBasis: "licensed" },
  { id: "payment-identifier", capability: "payment", targetTypes: ["payment_identifier"], credentialEnv: "PAYMENT_INTELLIGENCE_API_KEY", legalBasis: "licensed" },
];

export function providerAvailability(registration: ProviderCapabilityRegistration, env: NodeJS.ProcessEnv = process.env) {
  if (!registration.credentialEnv) return { status: "available" as const };
  return env[registration.credentialEnv]
    ? { status: "available" as const }
    : { status: "unavailable" as const, code: "PROVIDER_UNAVAILABLE" as const, reason: `${registration.credentialEnv} is not configured.` };
}

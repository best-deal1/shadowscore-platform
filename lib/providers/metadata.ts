import type { ProviderCategory } from "./types";

export type ProviderMetadata = {
  id: string;
  name: string;
  version: string;
  category: ProviderCategory;
};

export const DEFAULT_PROVIDER_METADATA: ProviderMetadata[] = [
  { id: "ssl", name: "SSL Certificate Provider", version: "2.0.0", category: "ssl" },
  { id: "dns", name: "DNS Provider", version: "1.0.0", category: "dns" },
  { id: "whois", name: "WHOIS Provider", version: "1.0.0", category: "whois" },
  { id: "security-headers", name: "HTTP Security Headers Provider", version: "2.0.0", category: "security_headers" },
  { id: "spf", name: "SPF Provider", version: "2.0.0", category: "email_authentication" },
  { id: "dmarc", name: "DMARC Provider", version: "2.0.0", category: "email_authentication" },
  { id: "reputation", name: "Reputation Provider", version: "2.0.0", category: "reputation" },
  { id: "website-metadata", name: "Website Metadata Provider", version: "1.0.0", category: "business_profile" },
  { id: "contact-discovery", name: "Contact Discovery Provider", version: "1.0.0", category: "business_profile" },
  { id: "social-profile", name: "Social Profile Discovery Provider", version: "1.0.0", category: "business_profile" },
  { id: "business-profile", name: "Public Business Profile Provider", version: "2.0.0", category: "business_profile" },
  { id: "marketplace", name: "Marketplace Provider", version: "1.0.0", category: "marketplace" },
  { id: "payment", name: "Payment Provider", version: "1.0.0", category: "payment" },
  { id: "compliance", name: "Compliance Provider", version: "1.0.0", category: "compliance" },
];

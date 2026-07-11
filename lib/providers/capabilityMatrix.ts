export type ProviderCapability = {
  provider: string;
  status: "Implemented" | "Placeholder";
  implemented: boolean;
  productionReady: boolean;
  evidenceProduced: string[];
  confidence: string;
  countrySupport: string;
  rateLimits: string;
};

export const PROVIDER_CAPABILITY_MATRIX: ProviderCapability[] = [
  { provider: "SSL Certificate", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["certificate domain", "issuer", "expiration", "SANs"], confidence: "High when TLS handshake succeeds", countrySupport: "Global", rateLimits: "Network timeout only" },
  { provider: "HTTP Security Headers", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["HSTS", "CSP", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"], confidence: "High from live HTTP response", countrySupport: "Global", rateLimits: "Target server rate limits may apply" },
  { provider: "SPF", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["SPF TXT record"], confidence: "High from DNS TXT", countrySupport: "Global", rateLimits: "Resolver limits" },
  { provider: "DMARC", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["DMARC TXT record"], confidence: "High from DNS TXT", countrySupport: "Global", rateLimits: "Resolver limits" },
  { provider: "Public Business Profile", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["website title", "schema.org organization name"], confidence: "Medium from public website", countrySupport: "Global public web", rateLimits: "Target server rate limits may apply" },
  { provider: "Company Registry", status: "Implemented", implemented: true, productionReady: false, evidenceProduced: ["country-aware registry architecture via WHOIS/RDAP and business profile fallbacks"], confidence: "Medium until official registry APIs are added", countrySupport: "Architecture supports country routing; public-web fallback is global", rateLimits: "Depends on future registry API" },
  { provider: "Reputation Abstraction", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["local reputation abstraction signal"], confidence: "Low/medium without paid blacklist feeds", countrySupport: "Global", rateLimits: "None for local abstraction" },
  { provider: "Website Metadata", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["meta description", "website domain"], confidence: "Medium from public website", countrySupport: "Global", rateLimits: "Target server rate limits may apply" },
  { provider: "Contact Discovery", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["public email", "public phone"], confidence: "Medium from public website", countrySupport: "Global", rateLimits: "Target server rate limits may apply" },
  { provider: "Social Profile Discovery", status: "Implemented", implemented: true, productionReady: true, evidenceProduced: ["public social links"], confidence: "Medium from public website links", countrySupport: "Global", rateLimits: "Target server rate limits may apply" },
  { provider: "Marketplace", status: "Placeholder", implemented: false, productionReady: false, evidenceProduced: ["Not Checked evidence only"], confidence: "None", countrySupport: "Not supported", rateLimits: "Requires private marketplace API" },
  { provider: "Payment", status: "Placeholder", implemented: false, productionReady: false, evidenceProduced: ["Not Checked evidence only"], confidence: "None", countrySupport: "Not supported", rateLimits: "Requires payment processor API" },
  { provider: "Compliance", status: "Placeholder", implemented: false, productionReady: false, evidenceProduced: ["Not Checked evidence only"], confidence: "None", countrySupport: "Not supported", rateLimits: "Requires official authority API" },
];

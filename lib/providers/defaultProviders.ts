import { AuthoritativeCompanyEvidenceProvider, BusinessProfileProvider, ContactDiscoveryProvider, DMARCProvider, DNSProvider, ReputationProvider, SecurityHeadersProvider, SocialProfileProvider, SPFProvider, SSLProvider, WebsiteMetadataProvider, WHOISProvider } from "./productionProviders";

export function createDefaultProviders() {
  return [
    new SSLProvider(),
    new DNSProvider(),
    new WHOISProvider(),
    new SecurityHeadersProvider(),
    new SPFProvider(),
    new DMARCProvider(),
    new AuthoritativeCompanyEvidenceProvider(),
    new BusinessProfileProvider(),
    new ReputationProvider(),
    new WebsiteMetadataProvider(),
    new ContactDiscoveryProvider(),
    new SocialProfileProvider(),
  ];
}

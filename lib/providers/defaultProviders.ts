import { AuthoritativeCompanyEvidenceProvider, BusinessProfileProvider, ContactDiscoveryProvider, DMARCProvider, DNSProvider, ReputationProvider, SecurityHeadersProvider, SocialProfileProvider, SPFProvider, SSLProvider, WebsiteMetadataProvider, WHOISProvider } from "./productionProviders";
import { DKIMProvider, RobotsTxtProvider, SecurityTxtProvider } from "./domainPolicyProviders";

export function createDefaultProviders() {
  return [
    new SSLProvider(),
    new DNSProvider(),
    new WHOISProvider(),
    new SecurityHeadersProvider(),
    new SPFProvider(),
    new DMARCProvider(),
    new DKIMProvider(),
    new RobotsTxtProvider(),
    new SecurityTxtProvider(),
    new AuthoritativeCompanyEvidenceProvider(),
    new BusinessProfileProvider(),
    new ReputationProvider(),
    new WebsiteMetadataProvider(),
    new ContactDiscoveryProvider(),
    new SocialProfileProvider(),
  ];
}

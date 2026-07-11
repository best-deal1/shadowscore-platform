import { DNSProvider } from "./DNSProvider";
import { WHOISProvider } from "./WHOISProvider";
import { createPlaceholderProviders } from "./placeholderProviders";
import { BusinessProfileProvider, ContactDiscoveryProvider, DMARCProvider, ReputationProvider, SecurityHeadersProvider, SocialProfileProvider, SPFProvider, SSLProvider, WebsiteMetadataProvider } from "./productionProviders";

export function createDefaultProviders() {
  return [
    new SSLProvider(),
    new DNSProvider(),
    new WHOISProvider(),
    new SecurityHeadersProvider(),
    new SPFProvider(),
    new DMARCProvider(),
    new BusinessProfileProvider(),
    new ReputationProvider(),
    new WebsiteMetadataProvider(),
    new ContactDiscoveryProvider(),
    new SocialProfileProvider(),
    ...createPlaceholderProviders(),
  ];
}

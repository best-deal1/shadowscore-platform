import { DNSProvider } from "./DNSProvider";
import { WHOISProvider } from "./WHOISProvider";
import { createPlaceholderProviders } from "./placeholderProviders";

export function createDefaultProviders() {
  return [
    ...createPlaceholderProviders(),
    new DNSProvider(),
    new WHOISProvider(),
  ];
}

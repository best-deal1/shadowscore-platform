import { WHOISProvider } from "./WHOISProvider";
import { createPlaceholderProviders } from "./placeholderProviders";

export function createDefaultProviders() {
  const placeholderProviders = createPlaceholderProviders();

  return [
    ...placeholderProviders.slice(0, 2),
    new WHOISProvider(),
    ...placeholderProviders.slice(2),
  ];
}

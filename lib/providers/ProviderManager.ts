import type { Provider, ProviderExecutionContext, ProviderResult } from "./types";

export class ProviderManager {
  private readonly providers = new Map<string, Provider>();

  register(provider: Provider) {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider already registered: ${provider.id}`);
    }

    this.providers.set(provider.id, provider);
    return this;
  }

  registerMany(providers: Provider[]) {
    providers.forEach((provider) => this.register(provider));
    return this;
  }

  listProviders() {
    return Array.from(this.providers.values()).map((provider) => ({
      id: provider.id,
      name: provider.name,
      version: provider.version,
      category: provider.category,
    }));
  }

  async runProviders(context: ProviderExecutionContext): Promise<ProviderResult[]> {
    const results: ProviderResult[] = [];

    for (const provider of this.providers.values()) {
      results.push(await provider.execute(context));
    }

    return results;
  }
}

import type { EnginePlanStep, SkippedEngine } from "../orchestrator/types";
import type { Provider, ProviderExecutionContext, ProviderResult } from "./types";

export type ProviderExecutionState = "executed" | "skipped" | "pending" | "failed";

export type ProviderExecutionRecord = {
  engineId: string;
  label: string;
  order: number;
  status: ProviderExecutionState;
  providerId?: string;
  reason?: string;
  duration?: number;
  evidenceCount: number;
  findingCount: number;
  errors: string[];
};

export type ProviderExecutionRun = {
  providerResults: ProviderResult[];
  executionRecords: ProviderExecutionRecord[];
};

const ENGINE_PROVIDER_ALIASES: Record<string, string[]> = {
  headers: ["headers", "security-headers"],
  domain: ["domain", "dns"],
};

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

  async runExecutionPlan(context: ProviderExecutionContext, executionPlan: EnginePlanStep[], skippedEngines: SkippedEngine[] = []): Promise<ProviderExecutionRun> {
    const providerResults: ProviderResult[] = [];
    const executionRecords: ProviderExecutionRecord[] = [];

    for (const step of executionPlan.sort((a, b) => a.order - b.order)) {
      const provider = this.providerForEngine(step.engineId);

      if (!provider) {
        executionRecords.push({
          engineId: step.engineId,
          label: step.label,
          order: step.order,
          status: "skipped",
          reason: "No registered provider is available for this orchestrator step.",
          evidenceCount: 0,
          findingCount: 0,
          errors: [],
        });
        continue;
      }

      const result = await provider.execute(context);
      providerResults.push(result);
      executionRecords.push({
        engineId: step.engineId,
        label: step.label,
        order: step.order,
        status: result.status === "completed" ? "executed" : result.status,
        providerId: result.providerId,
        reason: step.reason,
        duration: result.duration,
        evidenceCount: result.evidence.length,
        findingCount: result.findings.length,
        errors: result.errors,
      });
    }

    skippedEngines.forEach((engine, index) => {
      executionRecords.push({
        engineId: engine.engineId,
        label: engine.label,
        order: executionPlan.length + index + 1,
        status: "pending",
        reason: engine.reason,
        evidenceCount: 0,
        findingCount: 0,
        errors: [],
      });
    });

    return { providerResults, executionRecords };
  }

  private providerForEngine(engineId: string) {
    const candidates = [engineId, ...(ENGINE_PROVIDER_ALIASES[engineId] || [])];
    return candidates.map((id) => this.providers.get(id)).find(Boolean);
  }
}

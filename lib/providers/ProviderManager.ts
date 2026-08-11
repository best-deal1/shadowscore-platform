import type { EnginePlanStep, SkippedEngine } from "../orchestrator/types";
import { deterministicEntityResolver, type EntityResolver } from "../entityResolution";
import type { Provider, ProviderExecutionContext, ProviderResult } from "./types";

export type ProviderExecutionState = "executed" | "skipped" | "pending" | "failed";
export type PreviewProviderCompletion = "still_processing" | "timed_out" | "unavailable" | "deferred_to_full_report";

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

export type PreviewExecutionTelemetry = {
  budgetMs: number;
  elapsedMs: number;
  timedOut: boolean;
  concurrencyLimit: number;
  providerTimings: Array<{ providerId: string; category: string; status: string; duration: number; startedAt: string; completedAt: string; classification?: PreviewProviderCompletion }>;
  deferredProviders: Array<{ providerId: string; providerName: string; category: string; classification: PreviewProviderCompletion; reason: string }>;
};

export type PreviewExecutionRun = ProviderExecutionRun & { telemetry: PreviewExecutionTelemetry };

const ENGINE_PROVIDER_ALIASES: Record<string, string[]> = {
  headers: ["headers", "security-headers"],
  domain: ["domain", "dns"],
};

const DEFAULT_PREVIEW_BUDGET_MS = 12_000;
const DEFAULT_PREVIEW_CONCURRENCY = 4;
const CRITICAL_PREVIEW_PROVIDER_IDS = new Set(["dns", "whois", "ssl", "business-profile", "website-metadata", "threat-reputation", "website-commerce"]);
const PREVIEW_PROVIDER_PRIORITY = ["dns", "whois", "ssl", "threat-reputation", "business-profile", "website-commerce", "website-metadata", "contact-discovery", "security-headers", "spf", "dmarc", "social-profile", "reputation", "authoritative-company"];
const FULL_REPORT_ONLY_PREVIEW_PROVIDER_IDS = new Set<string>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deferredResult(provider: Provider, context: ProviderExecutionContext, startedAt: Date, classification: PreviewProviderCompletion, reason: string): ProviderResult {
  const completedAt = new Date();
  return {
    providerId: provider.id,
    providerVersion: provider.version,
    status: "skipped",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    duration: completedAt.getTime() - startedAt.getTime(),
    findings: [],
    evidence: [],
    metadata: {
      category: provider.category,
      providerName: provider.name,
      lookupPerformed: false,
      previewClassification: classification,
      deferredToFullReport: classification === "deferred_to_full_report" || classification === "still_processing",
      failureReason: classification === "timed_out" ? "Timeout" : classification === "unavailable" ? "Unavailable" : undefined,
      intakeId: context.intakeId,
    },
    errors: [reason],
  };
}

function resultClassification(result: ProviderResult): PreviewProviderCompletion | undefined {
  if (typeof result.metadata.previewClassification === "string") return result.metadata.previewClassification as PreviewProviderCompletion;
  if (result.metadata.failureReason === "Timeout") return "timed_out";
  if (result.status !== "completed") return "unavailable";
  return undefined;
}

export class ProviderManager {
  private readonly providers = new Map<string, Provider>();
  private readonly entityResolver: EntityResolver;

  constructor(entityResolver: EntityResolver = deterministicEntityResolver) {
    this.entityResolver = entityResolver;
  }

  private resolveContext(context: ProviderExecutionContext): ProviderExecutionContext {
    if (context.resolvedEntity) return context;
    return { ...context, resolvedEntity: this.entityResolver.resolve(context) };
  }

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
    context = this.resolveContext(context);
    const results: ProviderResult[] = [];

    for (const provider of this.providers.values()) {
      results.push(await provider.execute(context));
    }

    return results;
  }

  async runFreePreview(context: ProviderExecutionContext, options: { budgetMs?: number; concurrencyLimit?: number } = {}): Promise<PreviewExecutionRun> {
    context = this.resolveContext(context);
    const started = Date.now();
    const budgetMs = options.budgetMs ?? DEFAULT_PREVIEW_BUDGET_MS;
    const concurrencyLimit = Math.max(1, options.concurrencyLimit ?? DEFAULT_PREVIEW_CONCURRENCY);
    const allProviders = Array.from(this.providers.values()).sort((a, b) => {
      const ai = PREVIEW_PROVIDER_PRIORITY.indexOf(a.id);
      const bi = PREVIEW_PROVIDER_PRIORITY.indexOf(b.id);
      return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
    });
    const providers = allProviders.filter((provider) => !FULL_REPORT_ONLY_PREVIEW_PROVIDER_IDS.has(provider.id));
    const fullReportOnlyProviders = allProviders.filter((provider) => FULL_REPORT_ONLY_PREVIEW_PROVIDER_IDS.has(provider.id));
    const queue = [...providers];
    const providerResults: ProviderResult[] = [];
    const launched = new Set<string>();
    const inFlight = new Map<string, { provider: Provider; startedAt: Date; promise: Promise<ProviderResult> }>();

    const launchMore = () => {
      while (queue.length && inFlight.size < concurrencyLimit && Date.now() - started < budgetMs) {
        const provider = queue.shift()!;
        const startedAt = new Date();
        launched.add(provider.id);
        inFlight.set(provider.id, { provider, startedAt, promise: provider.execute(context) });
      }
    };

    launchMore();
    while (inFlight.size && Date.now() - started < budgetMs) {
      const remaining = Math.max(0, budgetMs - (Date.now() - started));
      const settled = await Promise.race([
        ...Array.from(inFlight.values()).map(({ provider, promise }) => promise.then((result) => ({ provider, result }))),
        delay(remaining).then(() => undefined),
      ]);
      if (!settled) break;
      inFlight.delete(settled.provider.id);
      providerResults.push(settled.result);
      launchMore();
    }

    const deferredProviders: PreviewExecutionTelemetry["deferredProviders"] = [];
    for (const { provider, startedAt } of inFlight.values()) {
      const classification = CRITICAL_PREVIEW_PROVIDER_IDS.has(provider.id) ? "timed_out" : "still_processing";
      const reason = classification === "timed_out" ? `Provider exceeded the ${budgetMs}ms free-preview budget.` : "Provider is still processing and is deferred to the full report.";
      providerResults.push(deferredResult(provider, context, startedAt, classification, reason));
      deferredProviders.push({ providerId: provider.id, providerName: provider.name, category: provider.category, classification, reason });
    }
    for (const provider of [...queue, ...fullReportOnlyProviders]) {
      const reason = "Provider was not started before the free-preview budget was reached; it is deferred to the full report.";
      providerResults.push(deferredResult(provider, context, new Date(), "deferred_to_full_report", reason));
      deferredProviders.push({ providerId: provider.id, providerName: provider.name, category: provider.category, classification: "deferred_to_full_report", reason });
    }

    providerResults.sort((a, b) => allProviders.findIndex((p) => p.id === a.providerId) - allProviders.findIndex((p) => p.id === b.providerId));
    const elapsedMs = Date.now() - started;
    const telemetry: PreviewExecutionTelemetry = {
      budgetMs,
      elapsedMs,
      timedOut: elapsedMs >= budgetMs || deferredProviders.length > 0,
      concurrencyLimit,
      providerTimings: providerResults.map((result) => ({ providerId: result.providerId, category: String(result.metadata.category || "unknown"), status: result.status, duration: result.duration, startedAt: result.startedAt, completedAt: result.completedAt, classification: resultClassification(result) })),
      deferredProviders,
    };
    const executionRecords = providerResults.map((result, index) => ({ engineId: result.providerId, label: String(result.metadata.providerName || result.providerId), order: index + 1, status: result.status === "completed" ? "executed" as const : result.status, providerId: result.providerId, reason: result.errors[0], duration: result.duration, evidenceCount: result.evidence.length, findingCount: result.findings.length, errors: result.errors }));
    return { providerResults, executionRecords, telemetry };
  }

  async runExecutionPlan(context: ProviderExecutionContext, executionPlan: EnginePlanStep[], skippedEngines: SkippedEngine[] = []): Promise<ProviderExecutionRun> {
    context = this.resolveContext(context);
    const providerResults: ProviderResult[] = [];
    const executionRecords: ProviderExecutionRecord[] = [];

    for (const step of executionPlan.sort((a, b) => a.order - b.order)) {
      const provider = this.providerForEngine(step.engineId);

      if (!provider) {
        executionRecords.push({ engineId: step.engineId, label: step.label, order: step.order, status: "skipped", reason: "No registered provider is available for this orchestrator step.", evidenceCount: 0, findingCount: 0, errors: [] });
        continue;
      }

      const result = await provider.execute(context);
      providerResults.push(result);
      executionRecords.push({ engineId: step.engineId, label: step.label, order: step.order, status: result.status === "completed" ? "executed" : result.status, providerId: result.providerId, reason: step.reason, duration: result.duration, evidenceCount: result.evidence.length, findingCount: result.findings.length, errors: result.errors });
    }

    skippedEngines.forEach((engine, index) => {
      executionRecords.push({ engineId: engine.engineId, label: engine.label, order: executionPlan.length + index + 1, status: "pending", reason: engine.reason, evidenceCount: 0, findingCount: 0, errors: [] });
    });

    return { providerResults, executionRecords };
  }

  private providerForEngine(engineId: string) {
    const candidates = [engineId, ...(ENGINE_PROVIDER_ALIASES[engineId] || [])];
    return candidates.map((id) => this.providers.get(id)).find(Boolean);
  }
}

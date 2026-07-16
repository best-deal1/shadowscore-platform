import type { Provider, ProviderCategory, ProviderExecutionContext, ProviderEvidence, ProviderFailureReason, ProviderFinding, ProviderHealth, ProviderResult } from "./types";

export abstract class BaseProvider implements Provider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly category: ProviderCategory;

  async execute(context: ProviderExecutionContext): Promise<ProviderResult> {
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();

    try {
      const result = await this.collect(context);
      const completedAtDate = new Date();

      return {
        providerId: this.id,
        providerVersion: this.version,
        status: "completed",
        startedAt,
        completedAt: completedAtDate.toISOString(),
        duration: completedAtDate.getTime() - startedAtDate.getTime(),
        findings: result.findings,
        evidence: result.evidence,
        metadata: {
          category: this.category,
          providerName: this.name,
          ...result.metadata,
        },
        errors: [],
      };
    } catch (error) {
      const completedAtDate = new Date();
      return {
        providerId: this.id,
        providerVersion: this.version,
        status: "skipped",
        startedAt,
        completedAt: completedAtDate.toISOString(),
        duration: completedAtDate.getTime() - startedAtDate.getTime(),
        findings: [],
        evidence: [],
        metadata: {
          category: this.category,
          providerName: this.name,
          failureReason: this.failureReason(error),
          failureKind: this.failureReason(error) === "Timeout" ? "network_failure" : "provider_failure",
          lookupPerformed: false,
        },
        errors: [error instanceof Error ? error.message : "Unknown provider execution error"],
      };
    }
  }

  normalize(context: ProviderExecutionContext): unknown {
    return context;
  }

  confidence(result: ProviderResult): number {
    return result.status === "completed" ? 75 : 0;
  }

  evidence(result: ProviderResult): ProviderEvidence[] {
    return result.evidence;
  }

  correlation(result: ProviderResult): unknown {
    return result.evidence.map((item) => ({ providerId: result.providerId, evidenceId: item.id, value: item.value }));
  }

  failureReason(error: unknown): ProviderFailureReason {
    if (error instanceof Error && (error.name === "AbortError" || /timeout|timed out/i.test(error.message))) return "Timeout";
    if (error instanceof Error && /429|rate limited/i.test(error.message)) return "Rate Limited";
    if (error instanceof Error && /not supported|invalid|requires/i.test(error.message)) return "Not Supported";
    return "Unavailable";
  }

  async health(): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      providerVersion: this.version,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      metadata: {
        category: this.category,
        providerName: this.name,
        integration: "placeholder",
      },
    };
  }

  protected placeholderFinding(title: string, description: string): ProviderFinding {
    return {
      id: `${this.id}-placeholder`,
      title,
      description,
      severity: "info",
    };
  }

  protected abstract collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">>;
}

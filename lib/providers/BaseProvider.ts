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
      const message = error instanceof Error ? error.message : "Unknown provider execution error";
      const failureReason = this.failureReason(error);
      const executionCode = /found no .*row|no authoritative match/i.test(message) ? "NO_AUTHORITATIVE_MATCH" : /unsupported jurisdiction/i.test(message) ? "UNSUPPORTED_JURISDICTION" : failureReason === "Unavailable" ? "PROVIDER_UNAVAILABLE" : failureReason === "Timeout" ? "PROVIDER_EXECUTION_TIMEOUT" : "PROVIDER_EXECUTION_FAILURE";
      const coverageState = executionCode === "UNSUPPORTED_JURISDICTION" || executionCode === "NO_AUTHORITATIVE_MATCH" ? "gap" : executionCode === "PROVIDER_UNAVAILABLE" ? "unavailable" : "failed";
      return {
        providerId: this.id,
        providerVersion: this.version,
        status: "skipped",
        startedAt,
        completedAt: completedAtDate.toISOString(),
        duration: completedAtDate.getTime() - startedAtDate.getTime(),
        findings: [],
        evidence: executionCode === "PROVIDER_UNAVAILABLE" ? [{ id: `${this.id}-unavailable`, type: "observation", label: `${this.name} availability`, value: failureReason, source: this.id }] : [],
        metadata: {
          category: this.category,
          providerName: this.name,
          failureReason,
          executionCode,
          executionReason: message,
          coverageState,
          jurisdiction: null,
          providerSupportedJurisdictions: this.id === "authoritative-company" ? ["US federal public issuers"] : [],
          lookupPerformed: false,
        },
        errors: [message],
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

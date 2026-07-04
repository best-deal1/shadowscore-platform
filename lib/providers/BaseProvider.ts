import type { Provider, ProviderCategory, ProviderExecutionContext, ProviderFinding, ProviderHealth, ProviderResult } from "./types";

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
        status: "failed",
        startedAt,
        completedAt: completedAtDate.toISOString(),
        duration: completedAtDate.getTime() - startedAtDate.getTime(),
        findings: [],
        evidence: [],
        metadata: {
          category: this.category,
          providerName: this.name,
        },
        errors: [error instanceof Error ? error.message : "Unknown provider execution error"],
      };
    }
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

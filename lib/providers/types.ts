import type { ResolvedEntity } from "../entityResolution";

export type ProviderCategory =
  | "ssl"
  | "dns"
  | "whois"
  | "security_headers"
  | "email_authentication"
  | "reputation"
  | "business_profile"
  | "marketplace"
  | "payment"
  | "compliance";

export type ProviderStatus = "completed" | "failed" | "skipped";

export type ProviderFailureReason = "Unavailable" | "Rate Limited" | "Not Supported" | "Timeout";

export type RegulatoryEvidenceClassification =
  | "routine"
  | "regulatory_action"
  | "litigation"
  | "criminal_enforcement"
  | "bankruptcy"
  | "sanctions";

export type ProviderFinding = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
};

export type ProviderEvidence = {
  id: string;
  type: "placeholder" | "configuration" | "document" | "observation";
  label: string;
  value?: string;
  source: string;
  regulatoryClassification?: RegulatoryEvidenceClassification;
  authoritative?: boolean;
};

export type ProviderExecutionContext = {
  intakeId: string;
  scanMode: string;
  target: string;
  requestedTarget?: string;
  companyId?: string;
  companyTicker?: string;
  platform: string;
  caseType?: string;
  email?: string;
  fileNames: string[];
  visibleSignalCategories: string[];
  paymentIntentId?: string;
  executionProfile?: "free_preview" | "paid_report";
  providerTimeoutMs?: Partial<Record<ProviderCategory | "http", number>>;
  dkimSelectors?: string[];
  resolvedEntity?: ResolvedEntity;
};

export type ProviderHealth = {
  providerId: string;
  providerVersion: string;
  status: "healthy" | "degraded" | "unavailable";
  checkedAt: string;
  metadata: Record<string, unknown>;
};

export type ProviderResult = {
  providerId: string;
  providerVersion: string;
  status: ProviderStatus;
  startedAt: string;
  completedAt: string;
  duration: number;
  findings: ProviderFinding[];
  evidence: ProviderEvidence[];
  metadata: Record<string, unknown>;
  errors: string[];
};

export interface Provider {
  id: string;
  name: string;
  version: string;
  category: ProviderCategory;
  execute(context: ProviderExecutionContext): Promise<ProviderResult>;
  normalize(context: ProviderExecutionContext): unknown;
  confidence(result: ProviderResult): number;
  evidence(result: ProviderResult): ProviderEvidence[];
  correlation(result: ProviderResult): unknown;
  failureReason(error: unknown): ProviderFailureReason;
  health(): Promise<ProviderHealth>;
}

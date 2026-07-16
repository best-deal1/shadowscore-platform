import type { ProviderResult } from "./providers/types";

export type AcquisitionFailureKind = "evidence_missing" | "provider_failure" | "network_failure" | "source_unavailable";

export type AcquisitionProviderHealth = {
  providerId: string;
  availability: "available" | "degraded" | "unavailable";
  latencyMs: number;
  failureRate: number;
  failureKind?: AcquisitionFailureKind;
  failureReason?: string;
  evidenceCount: number;
  businessEvidenceCount: number;
  confidenceWeight: number;
};

export type AcquisitionHealthReport = {
  generatedAt: string;
  providerAvailability: AcquisitionProviderHealth[];
  providerLatency: Record<string, number>;
  providerFailureRate: Record<string, number>;
  businessEvidence: {
    collected: number;
    providerFailuresExcluded: number;
    evidenceProviderIds: string[];
    note: string;
  };
};

const BUSINESS_EVIDENCE_LABELS = /business|organization|legal|registry|seller|profile|country|jurisdiction|contact|domain|website|certificate|dns|mx|spf|dmarc/i;

export function classifyAcquisitionFailure(result: ProviderResult): AcquisitionFailureKind | undefined {
  if (result.status === "completed") {
    return result.evidence.length === 0 && result.findings.length === 0 ? "evidence_missing" : undefined;
  }

  const text = `${result.metadata.failureReason || ""} ${result.errors.join(" ")}`.toLowerCase();
  if (/timeout|timed out|abort|econn|enotfound|network|dns|socket|fetch failed/.test(text)) return "network_failure";
  if (/404|not found|nxdomain|no such host|unavailable|temporarily unavailable|service unavailable|source unavailable/.test(text)) return "source_unavailable";
  return "provider_failure";
}

export function providerConfidenceWeight(result: ProviderResult): number {
  const explicit = result.metadata.providerConfidenceWeight;
  if (typeof explicit === "number") return Math.max(0, Math.min(1, explicit));
  const category = String(result.metadata.category || "");
  if (result.providerId === "authoritative-company" || /government|registry|compliance/.test(category)) return 0.98;
  if (/business_profile|marketplace|email_authentication/.test(category)) return 0.82;
  if (/dns|whois|ssl|security_headers/.test(category)) return 0.62;
  if (/reputation/.test(category)) return 0.55;
  return 0.5;
}

function hasBusinessEvidence(result: ProviderResult) {
  if (result.status !== "completed") return false;
  return result.evidence.some((item) => {
    const value = String(item.value || "").trim().toLowerCase();
    return Boolean(value && value !== "unavailable" && item.type !== "placeholder" && BUSINESS_EVIDENCE_LABELS.test(`${item.label} ${item.source}`));
  });
}

export function buildAcquisitionHealthReport(providerResults: ProviderResult[], generatedAt = new Date().toISOString()): AcquisitionHealthReport {
  const providerAvailability = providerResults.map((result) => {
    const failureKind = classifyAcquisitionFailure(result);
    const available = result.status === "completed";
    const evidenceCount = result.evidence.filter((item) => item.type !== "placeholder" && String(item.value || "").trim().toLowerCase() !== "unavailable").length;
    const businessEvidenceCount = hasBusinessEvidence(result) ? result.evidence.filter((item) => String(item.value || "").trim()).length : 0;
    return {
      providerId: result.providerId,
      availability: available ? (failureKind === "evidence_missing" ? "degraded" : "available") : "unavailable",
      latencyMs: result.duration,
      failureRate: available && failureKind !== "evidence_missing" ? 0 : 1,
      failureKind,
      failureReason: typeof result.metadata.failureReason === "string" ? result.metadata.failureReason : result.errors[0],
      evidenceCount,
      businessEvidenceCount,
      confidenceWeight: providerConfidenceWeight(result),
    } satisfies AcquisitionProviderHealth;
  });

  return {
    generatedAt,
    providerAvailability,
    providerLatency: Object.fromEntries(providerAvailability.map((item) => [item.providerId, item.latencyMs])),
    providerFailureRate: Object.fromEntries(providerAvailability.map((item) => [item.providerId, item.failureRate])),
    businessEvidence: {
      collected: providerAvailability.reduce((sum, item) => sum + item.businessEvidenceCount, 0),
      providerFailuresExcluded: providerAvailability.filter((item) => item.failureKind && item.failureKind !== "evidence_missing").length,
      evidenceProviderIds: providerAvailability.filter((item) => item.businessEvidenceCount > 0).map((item) => item.providerId),
      note: "Business evidence is counted only from completed providers with observed evidence; provider/network/source failures are reported separately and do not become missing business evidence.",
    },
  };
}

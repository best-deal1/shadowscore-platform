import type { ProviderCategory, ProviderEvidence, ProviderFinding, ProviderResult } from "../providers/types";

export type EvidenceCategory = "Verified" | "Missing" | "Negative" | "Unavailable" | "Not Checked" | "Not Applicable";
export type EvidenceStatus = "observed" | "missing" | "negative" | "unavailable" | "not_checked" | "not_applicable";

export type EvidenceRef = { id: string; type: ProviderEvidence["type"] | "finding" | "provider"; label: string; value?: string; source: string };
export type EvidenceItem = { id: string; source: string; provider: string; category: EvidenceCategory; status: EvidenceStatus; confidence: number; title: string; description: string; businessImpact: string; evidenceRefs: EvidenceRef[] };
export type EvidenceBuildInput = { providerResults: ProviderResult[]; notCheckedProviders?: Array<{ providerId: string; category?: ProviderCategory; reason: string }> };
export type ProviderFindingLike = Pick<ProviderFinding, "id" | "title" | "description" | "severity">;
export type EvidenceSummary = {
  verifiedEvidence: EvidenceItem[]; missingVerification: EvidenceItem[]; negativeFindings: EvidenceItem[]; unavailableProviders: EvidenceItem[]; notYetChecked: EvidenceItem[]; counts: Record<EvidenceCategory, number>;
  examples: { evidenceItems: EvidenceItem[]; summary: { counts: Record<EvidenceCategory, number> } };
  providerMapping: Array<{ provider: string; category: ProviderCategory | "unknown"; producedEvidence: number; statuses: EvidenceStatus[] }>;
  decisionMapping: Array<{ evidenceCategory: EvidenceCategory; decisionUse: string }>;
  architecture: string[]; knownGaps: string[];
};

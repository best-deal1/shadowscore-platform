export const TRUST_DIMENSIONS = ["identity", "operational", "financial", "compliance", "marketplace", "cyber", "reputation", "relationships", "evidenceQuality"] as const;
export type TrustDimension = typeof TRUST_DIMENSIONS[number];
export type TrustRecommendation = "Proceed" | "Proceed with Monitoring" | "Manual Review" | "High Risk" | "Do Not Engage";
export type TrustAlertType = "TrustDropped" | "TrustRecovered" | "ComplianceIssueDetected" | "HighRiskRelationship" | "WebsiteCompromised" | "DomainOwnershipChanged" | "MarketplaceSuspended" | "FraudSignalDetected";

export type TrustSignal = {
  signalId: string; entityId: string; dimension: TrustDimension; factor: string;
  effect: "positive" | "negative"; strength: number; confidence: number;
  observedAt: string; expiresAt?: string; evidenceReferences: string[];
  sourceReliability: number; corroboration: number; description: string;
};

export type TrustPolicy = {
  version: string; dimensionWeights: Record<TrustDimension, number>;
  factorWeights: Partial<Record<TrustDimension, Record<string, number>>>;
  missingBaseline: number; alertDropThreshold: number;
};

export type TrustDriver = TrustSignal & { contribution: number; freshness: number };
export type DimensionScore = {
  score: number; confidence: number; why: string;
  positiveEvidence: TrustDriver[]; negativeEvidence: TrustDriver[];
  missingEvidence: string[]; evidenceFreshness: number;
};
export type TrustSnapshot = {
  snapshotId: string; entityId: string; computedAt: string;
  scores: Record<TrustDimension, DimensionScore>; overall: number; confidence: number;
  recommendation: TrustRecommendation; policyVersion: string; computationVersion: string;
  inputSignalIds: string[]; previousSnapshotId: string | null; changeReason: string;
};
export type TrustAlert = { alertId: string; entityId: string; type: TrustAlertType; severity: "low" | "medium" | "high" | "critical"; createdAt: string; explanation: string; evidenceReferences: string[]; snapshotId: string };
export type TrustEvent = { eventId: string; entityId: string; type: "SignalRecorded" | "TrustComputed" | TrustAlertType; occurredAt: string; payload: Record<string, unknown>; schemaVersion: 1 };

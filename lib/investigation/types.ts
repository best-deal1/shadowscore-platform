import type { DecisionIntelligenceOutput, DecisionOutput } from "../decisionEngine";
import type { OntologyGraph } from "../ontology/types";
import type { ProviderExecutionRecord } from "../providers/ProviderManager";
import type { TargetType } from "../targetClassifier/types";

export type InvestigationStatus =
  | "draft"
  | "preview"
  | "saved"
  | "payment_pending"
  | "generating"
  | "ready"
  | "monitoring"
  | "failed"
  | "archived";

export type InvestigationOutcome =
  | "unresolved"
  | "verified"
  | "rejected"
  | "escalated"
  | "monitored"
  | "resolved";

export type InvestigationDecision = DecisionOutput | DecisionIntelligenceOutput | string | null;

export type InvestigationTechnicalStatus = {
  executed: ProviderExecutionRecord[];
  skipped: ProviderExecutionRecord[];
  pending: ProviderExecutionRecord[];
  failed: ProviderExecutionRecord[];
};

export type Investigation = {
  investigationId: string;
  target: string;
  normalizedTarget: string;
  targetType: TargetType;
  status: InvestigationStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  userId?: string;
  intakeId?: string;
  reportId?: string;
  paymentIntentId?: string;
  ontologyGraph: OntologyGraph;
  evidenceRefs: string[];
  decision: InvestigationDecision;
  verificationScore?: number;
  narrativeSummary?: string;
  technicalStatus: InvestigationTechnicalStatus;
  outcome: InvestigationOutcome;
};

export type InvestigationSeed = {
  target: string;
  normalizedTarget?: string;
  targetType?: TargetType;
  userId?: string;
  intakeId?: string;
  reportId?: string;
  paymentIntentId?: string;
  createdAt?: string;
  investigationId?: string;
};

export type InvestigationPatch = Partial<
  Pick<
    Investigation,
    | "normalizedTarget"
    | "targetType"
    | "userId"
    | "intakeId"
    | "reportId"
    | "paymentIntentId"
    | "ontologyGraph"
    | "evidenceRefs"
    | "decision"
    | "verificationScore"
    | "narrativeSummary"
    | "technicalStatus"
    | "outcome"
    | "completedAt"
  >
>;

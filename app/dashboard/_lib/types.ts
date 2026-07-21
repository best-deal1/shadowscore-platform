export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type InvestigationStatus =
  | "In review"
  | "Collecting evidence"
  | "Ready for decision"
  | "Monitoring";

export type Investigation = {
  id: string;
  subject: string;
  risk: RiskLevel;
  confidence: number;
  status: InvestigationStatus;
  analyst: string;
  updated: string;
  evidenceCount: number;
  nextAction: string;
  evidenceSummary: string;
  riskReasons: string[];
};

export type Activity = {
  id: string;
  type:
    | "Evidence"
    | "Risk change"
    | "Monitoring"
    | "Analyst action"
    | "Report"
    | "Assignment";
  title: string;
  detail: string;
  time: string;
  tone: "sky" | "red" | "amber" | "emerald";
};

export type MonitoringAlert = {
  id: string;
  entity: string;
  type: string;
  severity: RiskLevel;
  change: string;
  detectedAt: string;
  investigationId: string;
  acknowledged: boolean;
  businessImpact: string;
};

export type SavedView = {
  id: string;
  label: string;
  count: number;
  filter:
    | "all"
    | "assigned"
    | "high-risk"
    | "evidence"
    | "decision"
    | "recent"
    | "monitoring";
};

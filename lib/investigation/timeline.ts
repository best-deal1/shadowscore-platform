import type { WebsiteIntelligenceReport } from "../websiteIntelligence";
export type InvestigationStageStatus = "pending" | "running" | "completed" | "unavailable" | "failed";
export type InvestigationStage = { id: string; label: string; status: InvestigationStageStatus; source: string; observedAt?: string };
const stages: Array<[string, string]> = [["identity", "Identity"], ["domain", "Domain"], ["dns", "DNS"], ["ssl", "SSL/TLS"], ["http", "HTTP"], ["security_headers", "Security Headers"], ["technology", "Technology"], ["infrastructure", "Infrastructure"], ["email", "Email Security"], ["reputation", "Reputation"], ["quality", "Website Quality"], ["screenshot", "Screenshot"], ["correlation", "Correlation"], ["business", "Business Intelligence"], ["decision", "Decision"], ["executive", "Executive Assessment"]];
export function buildInvestigationTimeline(input: { websiteIntelligence?: WebsiteIntelligenceReport; completedAt?: string; identityCompleted?: boolean; correlationCompleted?: boolean; businessCompleted?: boolean; decisionCompleted?: boolean; executiveCompleted?: boolean }): InvestigationStage[] {
  return stages.map(([id, label]) => {
    const stageModule = input.websiteIntelligence?.modules.find((item) => item.moduleId === id);
    if (stageModule) return { id, label, status: stageModule.status, source: stageModule.source, observedAt: input.websiteIntelligence?.scannedAt };
    const completed = (id === "identity" && input.identityCompleted) || (id === "correlation" && input.correlationCompleted) || (id === "business" && input.businessCompleted) || (id === "decision" && input.decisionCompleted) || (id === "executive" && input.executiveCompleted);
    return { id, label, status: completed ? "completed" : "pending", source: completed ? "Investigation pipeline" : "Execution plan", observedAt: completed ? input.completedAt : undefined };
  });
}

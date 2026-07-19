export type WebsiteModuleId = "domain" | "dns" | "ssl" | "http" | "security_headers" | "technology" | "infrastructure" | "email" | "reputation" | "quality" | "screenshot";
export type WebsiteModuleStatus = "completed" | "unavailable" | "failed";
export type WebsiteEvidence = { id: string; label: string; value: string; source: string; observedAt: string };
export type WebsiteFinding = { id: string; title: string; statement: string; severity: "info" | "low" | "medium" | "high"; evidenceIds: string[]; businessImpact: string; recommendation: string };
export type WebsiteModuleResult = { moduleId: WebsiteModuleId; moduleName: string; status: WebsiteModuleStatus; source: string; confidence: number; findings: WebsiteFinding[]; evidence: WebsiteEvidence[]; executiveSummary: string; error?: string; durationMs: number };
export type WebsiteScanContext = { target: string; timeoutMs?: number; retries?: number; fetch?: typeof fetch };
export interface WebsiteScanModule { id: WebsiteModuleId; name: string; source: string; scan(context: WebsiteScanContext): Promise<Omit<WebsiteModuleResult, "moduleId" | "moduleName" | "source" | "durationMs">>; }
export type WebsiteIntelligenceReport = { target: string; scannedAt: string; modules: WebsiteModuleResult[]; findings: WebsiteFinding[]; evidence: WebsiteEvidence[]; executiveSummary: string; recommendedActions: string[]; technicalHealth: string; securityPosture: string; infrastructureMaturity: string; trustIndicators: string };

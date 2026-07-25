import "./modules";
import { websiteModules } from "./registry";
import type { WebsiteEvidence, WebsiteIntelligenceReport, WebsiteModuleResult, WebsiteScanContext } from "./types";
export * from "./types";
export { registerWebsiteModule, websiteModules } from "./registry";
export { normalizeWebsiteEvidence } from "./evidence";
export { toCanonicalWebsiteReport, WEBSITE_REPORT_SCHEMA_VERSION } from "./canonicalReport";
export type { CanonicalWebsiteReport, CanonicalWebsiteEvidence, CanonicalWebsiteFinding } from "./canonicalReport";

function domainFor(target: string) { try { return new URL(target.includes("://") ? target : `https://${target}`).hostname.toLowerCase(); } catch { return target.trim().toLowerCase().replace(/^www\./, ""); } }
function unavailable(moduleId: WebsiteModuleResult["moduleId"], moduleName: string, source: string, message: string, started: number): WebsiteModuleResult {
 const observedAt = new Date().toISOString(); const evidence: WebsiteEvidence = { id: `${moduleId}:availability`, label: "Module availability", value: message, source, observedAt };
 return { moduleId, moduleName, source, status: "unavailable", confidence: 0, evidence: [evidence], findings: [{ id: `${moduleId}:unavailable`, title: `${moduleName} could not be completed`, statement: "This check was unavailable during the investigation. It does not determine website safety.", severity: "info", evidenceIds: [evidence.id], businessImpact: "An evidence gap remains in the website assessment.", recommendation: "Verify this area before relying on it for a high-value decision." }], executiveSummary: `${moduleName} was unavailable.`, error: message, durationMs: Date.now() - started };
}
export async function investigateWebsite(input: WebsiteScanContext): Promise<WebsiteIntelligenceReport> {
 const context = { ...input, target: domainFor(input.target), timeoutMs: input.timeoutMs ?? 5_000, retries: input.retries ?? 1 };
 const modules = websiteModules();
 const results = await Promise.all(modules.map(async (module) => { const started = Date.now(); let last: unknown;
   for (let attempt = 0; attempt <= (context.retries || 0); attempt += 1) try { const result = await module.scan(context); return { ...result, moduleId: module.id, moduleName: module.name, source: module.source, durationMs: Date.now() - started }; } catch (error) { last = error; }
   return unavailable(module.id, module.name, module.source, last instanceof Error ? last.message : "Provider unavailable", started);
 }));
 const findings = results.flatMap((result) => result.findings); const evidence = results.flatMap((result) => result.evidence);
 const actionable = findings.filter((item) => item.severity !== "info");
 return { target: context.target, scannedAt: new Date().toISOString(), modules: results, findings, evidence, recommendedActions: Array.from(new Set(actionable.map((item) => item.recommendation))), executiveSummary: results.map((item) => item.executiveSummary).join(" "), technicalHealth: actionable.some((item) => /HTTP|Website quality/i.test(item.title)) ? "Website improvements are recommended." : "No material website delivery issue was identified from the available checks.", securityPosture: actionable.some((item) => /security|TLS|Email|reputation/i.test(item.title)) ? "Security follow-up is recommended." : "No material security issue was identified from the available checks.", infrastructureMaturity: results.find((item) => item.moduleId === "infrastructure")?.executiveSummary || "Infrastructure evidence was not available.", trustIndicators: results.find((item) => item.moduleId === "quality")?.executiveSummary || "Website trust indicators were not available." };
}

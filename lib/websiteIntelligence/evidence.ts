import type { EvidenceItem } from "../evidence";
import type { WebsiteIntelligenceReport, WebsiteModuleResult } from "./types";

const categoryFor = (module: WebsiteModuleResult, findingId?: string): EvidenceItem["category"] => {
  if (module.status === "unavailable") return "Unavailable";
  if (module.status === "failed") return "Unavailable";
  if (findingId) return "Negative";
  return "Verified";
};

/** Maps Website Intelligence output into the canonical evidence contract. */
export function normalizeWebsiteEvidence(report: WebsiteIntelligenceReport): EvidenceItem[] {
  return report.modules.flatMap((module) => {
    const evidenceById = new Map(module.evidence.map((item) => [item.id, item]));
    const evidenceItems: EvidenceItem[] = module.evidence.map((item) => ({
      id: `website:${module.moduleId}:${item.id}`,
      source: item.source,
      provider: `website-${module.moduleId}`,
      category: categoryFor(module),
      status: module.status === "completed" ? "observed" : "unavailable",
      confidence: Math.round(module.confidence * 100),
      title: item.label,
      description: item.value,
      businessImpact: module.status === "completed" ? "This website evidence contributes to the investigation record." : "An evidence gap remains in this area.",
      evidenceRefs: [{ id: item.id, type: "document", label: item.label, value: item.value, source: item.source }],
    }));
    const findingItems: EvidenceItem[] = module.findings.map((item) => ({
      id: `website:${module.moduleId}:finding:${item.id}`,
      source: module.source,
      provider: `website-${module.moduleId}`,
      category: categoryFor(module, item.severity === "info" ? undefined : item.id),
      status: module.status === "completed" ? (item.severity === "info" ? "observed" : "negative") : "unavailable",
      confidence: Math.round(module.confidence * 100),
      title: item.title,
      description: item.statement,
      businessImpact: item.businessImpact,
      evidenceRefs: item.evidenceIds.map((id) => {
        const evidence = evidenceById.get(id);
        return { id, type: "document" as const, label: evidence?.label || id, value: evidence?.value, source: evidence?.source || module.source };
      }),
    }));
    return [...evidenceItems, ...findingItems];
  });
}

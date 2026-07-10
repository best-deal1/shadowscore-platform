import type { ProviderResult } from "../providers/types";
import { categoryToStatus, classifyProviderEvidence, classifyProviderFinding, classifyProviderResult, confidenceFor } from "./classification";
import type { EvidenceBuildInput, EvidenceItem } from "./types";

function providerTitle(providerId: string) { return providerId.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function impact(category: EvidenceItem["category"], title: string) { if (category === "Negative") return `${title} is verified negative evidence and may block a pass decision.`; if (category === "Missing") return `${title} is missing verification; this lowers confidence but is not risk evidence.`; if (category === "Unavailable") return `${title} could not be checked because the provider was unavailable; this is not a failed verification.`; if (category === "Not Checked") return `${title} was not checked in this run; this is neither unknown nor negative.`; return `${title} supports verification coverage.`; }
function unavailableItem(result: ProviderResult): EvidenceItem { const category = classifyProviderResult(result); const title = `${providerTitle(result.providerId)} provider ${category === "Unavailable" ? "unavailable" : "not checked"}`; return { id: `${result.providerId}-${category.toLowerCase().replace(/ /g, "-")}`, source: result.errors[0] || result.providerId, provider: result.providerId, category, status: categoryToStatus(category), confidence: confidenceFor(category, result), title, description: result.errors.join("; ") || `${providerTitle(result.providerId)} did not return production evidence.`, businessImpact: impact(category, title), evidenceRefs: [{ id: result.providerId, type: "provider", label: result.status, source: result.providerId }] }; }

export function buildEvidenceItems(input: EvidenceBuildInput | ProviderResult[]): EvidenceItem[] {
  const providerResults = Array.isArray(input) ? input : input.providerResults;
  const notCheckedProviders = Array.isArray(input) ? [] : input.notCheckedProviders || [];
  const items: EvidenceItem[] = [];
  for (const result of providerResults) {
    const beforeCount = items.length;
    if (result.status !== "completed" || result.metadata.integrationStatus === "not_connected" || result.metadata.lookupPerformed === false) items.push(unavailableItem(result));
    for (const evidence of result.evidence) { const category = classifyProviderEvidence(evidence); const title = evidence.label; items.push({ id: `${result.providerId}:${evidence.id}`, source: evidence.source, provider: result.providerId, category, status: categoryToStatus(category), confidence: confidenceFor(category, result), title, description: evidence.value ? `${evidence.label}: ${evidence.value}` : `${evidence.label} was not returned.`, businessImpact: impact(category, title), evidenceRefs: [{ id: evidence.id, type: evidence.type, label: evidence.label, value: evidence.value, source: evidence.source }] }); }
    for (const finding of result.findings) { const category = classifyProviderFinding(finding); items.push({ id: `${result.providerId}:finding:${finding.id}`, source: result.providerId, provider: result.providerId, category, status: categoryToStatus(category), confidence: confidenceFor(category, result, finding.severity), title: finding.title, description: finding.description, businessImpact: impact(category, finding.title), evidenceRefs: [{ id: finding.id, type: "finding", label: finding.title, source: result.providerId }] }); }
    if (items.length === beforeCount) {
      const category = classifyProviderResult(result);
      const title = `${providerTitle(result.providerId)} provider completed without returned evidence`;
      items.push({ id: `${result.providerId}:empty-result`, source: result.providerId, provider: result.providerId, category, status: categoryToStatus(category), confidence: confidenceFor(category, result), title, description: `${providerTitle(result.providerId)} returned no evidence references or findings.`, businessImpact: impact(category, title), evidenceRefs: [{ id: result.providerId, type: "provider", label: result.status, source: result.providerId }] });
    }
  }
  for (const provider of notCheckedProviders) { const title = `${providerTitle(provider.providerId)} not yet checked`; items.push({ id: `${provider.providerId}:not-checked`, source: "execution-plan", provider: provider.providerId, category: "Not Checked", status: "not_checked", confidence: 100, title, description: provider.reason, businessImpact: impact("Not Checked", title), evidenceRefs: [{ id: provider.providerId, type: "provider", label: "not checked", source: "execution-plan" }] }); }
  return items;
}

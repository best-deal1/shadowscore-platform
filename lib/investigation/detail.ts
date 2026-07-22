import type { OntologyEntity, OntologyRelationship } from "../ontology/types";
import type { Investigation } from "./types";

export type EvidenceCategory = "Identity" | "Payments" | "Marketplace" | "Infrastructure";
type EvidenceRecord = { id: string; title: string; category: EvidenceCategory; source: string; observedAt: string; reliability: "High" | "Medium"; detail: string; attachment: string };

export type InvestigationDetail = {
  investigation: Investigation;
  reference: string;
  risk: "Critical" | "High" | "Medium" | "Low";
  priority: "Critical" | "High" | "Normal" | "Low";
  assignedTo: string;
  summary: string;
  confidence: Array<{ category: EvidenceCategory; score: number; evidence: number; note: string }>;
  evidence: EvidenceRecord[];
  entities: Array<{ id: string; name: string; kind: string; risk?: boolean; position: string }>;
  relationships: Array<{ from: string; to: string; label: string; risky?: boolean }>;
  timeline: Array<{ time: string; title: string; detail: string; type: "evidence" | "risk" | "action" }>;
  audit: Array<{ time: string; actor: string; action: string; detail: string }>;
  reasons: Array<{ title: string; weight: string; detail: string }>;
};

const categories: EvidenceCategory[] = ["Identity", "Payments", "Marketplace", "Infrastructure"];
const positions = ["left-[6%] top-[43%]", "left-[43%] top-[12%]", "left-[49%] top-[67%]", "right-[5%] top-[35%]"];

/** Maps only fields stored on the requested investigation. No case fixture data is used here. */
export function buildInvestigationDetail(investigation: Investigation): InvestigationDetail {
  const evidence = investigation.evidenceRefs.map((id) => evidenceFromReference(id, investigation.updatedAt));
  const risk = riskFor(investigation, evidence);
  const priority = priorityFor(risk);
  const entities = investigation.ontologyGraph.entities.map((entity, index) => entityFor(entity, index, risk));
  const relationships = investigation.ontologyGraph.relationships
    .filter((relationship) => entities.some((entity) => entity.id === relationship.from) && entities.some((entity) => entity.id === relationship.to))
    .map(relationshipFor);
  const timeline = timelineFor(investigation, evidence, risk);

  return {
    investigation,
    reference: investigation.investigationId.toUpperCase(),
    risk,
    priority,
    assignedTo: investigation.userId || "Unassigned",
    summary: investigation.narrativeSummary || `Investigation for ${investigation.target} is ${investigation.status.replaceAll("_", " ")}.`,
    confidence: confidenceFor(evidence, investigation.verificationScore),
    evidence,
    entities,
    relationships,
    timeline,
    audit: auditFor(investigation, evidence, risk),
    reasons: reasonsFor(investigation, evidence, risk),
  };
}

function evidenceFromReference(id: string, observedAt: string): EvidenceRecord {
  const category = categoryFor(id);
  return { id, title: `${category} evidence reference`, category, source: "Investigation record", observedAt: formatDate(observedAt), reliability: "Medium", detail: `Reference ${id} is attached to this investigation.`, attachment: id };
}

function categoryFor(value: string): EvidenceCategory {
  const normalized = value.toLowerCase();
  if (/payment|account|merchant/.test(normalized)) return "Payments";
  if (/marketplace|seller|enforcement/.test(normalized)) return "Marketplace";
  if (/domain|dns|whois|host/.test(normalized)) return "Infrastructure";
  return "Identity";
}

function riskFor(investigation: Investigation, evidence: EvidenceRecord[]): InvestigationDetail["risk"] {
  const score = investigation.verificationScore ?? 0;
  if (score >= 90) return "Critical";
  if (score >= 75 || evidence.some((item) => item.category === "Payments")) return "High";
  if (score >= 50 || evidence.length > 0) return "Medium";
  return "Low";
}

function priorityFor(risk: InvestigationDetail["risk"]): InvestigationDetail["priority"] {
  return risk === "Critical" ? "Critical" : risk === "High" ? "High" : risk === "Medium" ? "Normal" : "Low";
}

function confidenceFor(evidence: EvidenceRecord[], score?: number): InvestigationDetail["confidence"] {
  return categories.filter((category) => evidence.some((item) => item.category === category)).map((category) => {
    const count = evidence.filter((item) => item.category === category).length;
    return { category, score: score ?? 0, evidence: count, note: "Based on references attached to this investigation." };
  });
}

function entityFor(entity: OntologyEntity, index: number, risk: InvestigationDetail["risk"]): InvestigationDetail["entities"][number] {
  return { id: entity.id, name: entity.label, kind: entity.type, risk: entity.type === "RiskSignal" || (risk === "Critical" && index === 0), position: positions[index % positions.length] };
}

function relationshipFor(relationship: OntologyRelationship): InvestigationDetail["relationships"][number] {
  return { from: relationship.from, to: relationship.to, label: relationship.label, risky: relationship.type === "LINKED_TO" || relationship.type === "TRIGGERED" };
}

function timelineFor(investigation: Investigation, evidence: EvidenceRecord[], risk: InvestigationDetail["risk"]): InvestigationDetail["timeline"] {
  const events: InvestigationDetail["timeline"] = [];
  if (evidence.length) events.push({ time: formatTime(investigation.updatedAt), title: "Evidence references attached", detail: `${evidence.length} reference${evidence.length === 1 ? "" : "s"} belongs to this investigation.`, type: "evidence" });
  if (investigation.verificationScore !== undefined) events.push({ time: formatTime(investigation.updatedAt), title: "Risk assessment recorded", detail: `${risk} risk based on the investigation's current confidence.`, type: "risk" });
  if (investigation.status !== "draft") events.push({ time: formatTime(investigation.createdAt), title: "Investigation created", detail: `Case opened for ${investigation.target}.`, type: "action" });
  return events;
}

function auditFor(investigation: Investigation, evidence: EvidenceRecord[], risk: InvestigationDetail["risk"]): InvestigationDetail["audit"] {
  const audit: InvestigationDetail["audit"] = [{ time: formatDate(investigation.createdAt), actor: investigation.userId || "System", action: "Created investigation", detail: `Opened case for ${investigation.target}.` }];
  if (evidence.length) audit.unshift({ time: formatDate(investigation.updatedAt), actor: "System", action: "Attached evidence references", detail: `${evidence.length} reference${evidence.length === 1 ? "" : "s"} attached to this investigation.` });
  if (investigation.verificationScore !== undefined) audit.unshift({ time: formatDate(investigation.updatedAt), actor: "System", action: "Recorded risk assessment", detail: `${risk} risk at ${investigation.verificationScore}% confidence.` });
  return audit;
}

function reasonsFor(investigation: Investigation, evidence: EvidenceRecord[], risk: InvestigationDetail["risk"]): InvestigationDetail["reasons"] {
  if (!evidence.length && investigation.verificationScore === undefined) return [];
  return [{ title: "Current investigation evidence", weight: `${risk} impact`, detail: `${evidence.length} attached evidence reference${evidence.length === 1 ? "" : "s"} and the current confidence determine this assessment.` }];
}

function formatDate(value: string) { return new Date(value).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC"; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }); }

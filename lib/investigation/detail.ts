import type { Investigation } from "./types";

export type EvidenceCategory = "Identity" | "Payments" | "Marketplace" | "Infrastructure";

export type InvestigationDetail = {
  investigation: Investigation;
  reference: string;
  risk: "Critical" | "High" | "Medium" | "Low";
  assignedTo: string;
  summary: string;
  confidence: Array<{ category: EvidenceCategory; score: number; evidence: number; note: string }>;
  evidence: Array<{ id: string; title: string; category: EvidenceCategory; source: string; observedAt: string; reliability: "High" | "Medium"; detail: string; attachment: string }>;
  entities: Array<{ id: string; name: string; kind: string; risk?: boolean; position: string }>;
  relationships: Array<{ from: string; to: string; label: string; risky?: boolean }>;
  timeline: Array<{ time: string; title: string; detail: string; type: "evidence" | "risk" | "action" }>;
  audit: Array<{ time: string; actor: string; action: string; detail: string }>;
  reasons: Array<{ title: string; weight: string; detail: string }>;
};

export function buildInvestigationDetail(investigation: Investigation): InvestigationDetail {
  const isNorthstar = investigation.investigationId === "inv-northstar";
  const target = investigation.target;
  return {
    investigation,
    reference: isNorthstar ? "INV-1042" : investigation.investigationId.toUpperCase(),
    risk: isNorthstar ? "Critical" : "Medium",
    assignedTo: "Maya Chen",
    summary: isNorthstar
      ? "Northstar Marketplace shares a payment account and operating address with restricted sellers. Registry records support the legal identity, but ownership and payment controls need confirmation before approval."
      : "This investigation is ready for evidence review. The workspace will show connected evidence, entities, and decision context as collection completes.",
    confidence: [
      { category: "Identity", score: isNorthstar ? 94 : 72, evidence: 8, note: "Legal entity and domain align." },
      { category: "Payments", score: isNorthstar ? 89 : 48, evidence: 6, note: isNorthstar ? "Account reuse links to restricted sellers." : "No payment evidence collected." },
      { category: "Marketplace", score: isNorthstar ? 86 : 55, evidence: 9, note: isNorthstar ? "Seller history shows repeated enforcement." : "Marketplace history is incomplete." },
      { category: "Infrastructure", score: isNorthstar ? 76 : 63, evidence: 5, note: "Hosting and domain records are consistent." },
    ],
    evidence: [
      { id: "EV-2081", title: "Beneficial ownership extract", category: "Identity", source: "Companies Registry", observedAt: "20 Jul 2026, 08:34 UTC", reliability: "High", detail: "Lists Elena Volkov as a controlling person for Northstar Marketplace Ltd.", attachment: "registry-extract.pdf" },
      { id: "EV-2082", title: "Payment account correlation", category: "Payments", source: "Payments network", observedAt: "20 Jul 2026, 08:31 UTC", reliability: "High", detail: "Account ending 4418 was also used by two restricted merchant profiles.", attachment: "payment-network.json" },
      { id: "EV-2083", title: "Seller enforcement history", category: "Marketplace", source: "Marketplace operations", observedAt: "20 Jul 2026, 08:29 UTC", reliability: "High", detail: "Two linked seller profiles were restricted for fulfilment policy violations.", attachment: "enforcement-history.csv" },
      { id: "EV-2084", title: "Domain registration snapshot", category: "Infrastructure", source: "Domain intelligence", observedAt: "20 Jul 2026, 08:25 UTC", reliability: "Medium", detail: "Domain registration predates the current legal entity by 14 months.", attachment: "domain-snapshot.pdf" },
    ],
    entities: [
      { id: "company", name: target, kind: "Subject", risk: true, position: "left-[6%] top-[43%]" },
      { id: "owner", name: "Elena Volkov", kind: "Controller", position: "left-[43%] top-[12%]" },
      { id: "payment", name: "Account •••• 4418", kind: "Payment account", risk: true, position: "left-[49%] top-[67%]" },
      { id: "seller", name: "Orion Goods", kind: "Restricted seller", risk: true, position: "right-[5%] top-[35%]" },
    ],
    relationships: [
      { from: "company", to: "owner", label: "controlled by" }, { from: "company", to: "payment", label: "uses", risky: true }, { from: "payment", to: "seller", label: "also used by", risky: true },
    ],
    timeline: [
      { time: "08:34", title: "Ownership extract attached", detail: "Companies Registry returned a current beneficial ownership record.", type: "evidence" },
      { time: "08:31", title: "Payment account link detected", detail: "A shared account connected the subject to two restricted sellers.", type: "risk" },
      { time: "08:29", title: "Marketplace history added", detail: "Operations records attached enforcement history for linked sellers.", type: "evidence" },
      { time: "08:24", title: "Case assigned to Maya Chen", detail: "Priority changed to Critical after payment correlation completed.", type: "action" },
    ],
    audit: [
      { time: "08:36 UTC", actor: "Maya Chen", action: "Opened decision review", detail: "Analyst review started." },
      { time: "08:34 UTC", actor: "System", action: "Attached evidence", detail: "EV-2081 from Companies Registry." },
      { time: "08:31 UTC", actor: "System", action: "Raised risk", detail: "Risk changed from High to Critical." },
      { time: "08:24 UTC", actor: "Lena Ortiz", action: "Assigned investigation", detail: "Assigned to Maya Chen." },
    ],
    reasons: [
      { title: "Shared payment account", weight: "High impact", detail: "The payment account is present on two restricted merchant profiles." },
      { title: "Repeated enforcement pattern", weight: "High impact", detail: "Linked sellers were restricted for fulfilment policy violations." },
      { title: "Identity timeline gap", weight: "Moderate impact", detail: "The domain registration predates the current legal entity." },
    ],
  };
}

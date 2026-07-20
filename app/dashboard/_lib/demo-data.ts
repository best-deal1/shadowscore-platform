import type { Activity, Investigation, MonitoringAlert, SavedView } from "./types";

export const investigations: Investigation[] = [
  { id: "INV-1042", subject: "Northstar Marketplace Ltd.", risk: "Critical", confidence: 91, status: "Ready for decision", analyst: "Maya Chen", updated: "12 min ago", evidenceCount: 28, nextAction: "Review restriction recommendation", evidenceSummary: "Payment, identity, and marketplace signals conflict." },
  { id: "INV-1038", subject: "Harborline Components", risk: "High", confidence: 84, status: "In review", analyst: "You", updated: "36 min ago", evidenceCount: 17, nextAction: "Confirm beneficial owner link", evidenceSummary: "Corporate record and address overlap need verification." },
  { id: "INV-1035", subject: "Vela Commerce Group", risk: "High", confidence: 76, status: "Collecting evidence", analyst: "Omar Rahman", updated: "1 hr ago", evidenceCount: 11, nextAction: "Request payment history", evidenceSummary: "Account behavior changed after a recent ownership update." },
  { id: "INV-1031", subject: "Morrow Freight Services", risk: "Medium", confidence: 68, status: "Monitoring", analyst: "You", updated: "2 hrs ago", evidenceCount: 9, nextAction: "Review monitoring alert", evidenceSummary: "A supplier address changed in a public registry." },
  { id: "INV-1028", subject: "Cedar & Stone Retail", risk: "Low", confidence: 93, status: "In review", analyst: "Lena Ortiz", updated: "Yesterday", evidenceCount: 22, nextAction: "Complete analyst review", evidenceSummary: "Evidence supports the reported business identity." },
];

export const activities: Activity[] = [
  { id: "a1", type: "Risk change", title: "Northstar Marketplace moved to Critical", detail: "Payment account reuse raised the risk score by 18 points.", time: "12 min ago", tone: "red" },
  { id: "a2", type: "Evidence", title: "New registry extract added", detail: "Maya Chen added a beneficial ownership record to INV-1038.", time: "36 min ago", tone: "sky" },
  { id: "a3", type: "Monitoring", title: "Address change detected", detail: "Morrow Freight Services updated a supplier address.", time: "1 hr ago", tone: "amber" },
  { id: "a4", type: "Report", title: "Decision brief is ready", detail: "INV-1042 has a report waiting for review.", time: "2 hrs ago", tone: "emerald" },
  { id: "a5", type: "Assignment", title: "Investigation assigned to you", detail: "Harborline Components was assigned by Lena Ortiz.", time: "3 hrs ago", tone: "sky" },
];

export const alerts: MonitoringAlert[] = [
  { id: "ALT-88", entity: "Northstar Marketplace Ltd.", type: "Payment network", severity: "Critical", change: "Payment account linked to two restricted sellers.", detectedAt: "12 min ago", investigationId: "INV-1042", acknowledged: false },
  { id: "ALT-85", entity: "Morrow Freight Services", type: "Entity profile", severity: "Medium", change: "Supplier address changed in registry data.", detectedAt: "1 hr ago", investigationId: "INV-1031", acknowledged: false },
  { id: "ALT-82", entity: "Vela Commerce Group", type: "Marketplace behavior", severity: "High", change: "Listing removal rate increased by 24%.", detectedAt: "4 hrs ago", investigationId: "INV-1035", acknowledged: false },
];

export const savedViews: SavedView[] = [
  { id: "all", label: "All active", count: 24, filter: "all" }, { id: "assigned", label: "Assigned to me", count: 6, filter: "assigned" },
  { id: "high", label: "High risk", count: 8, filter: "high-risk" }, { id: "evidence", label: "Awaiting evidence", count: 4, filter: "evidence" },
  { id: "decision", label: "Ready for decision", count: 3, filter: "decision" }, { id: "recent", label: "Recently updated", count: 9, filter: "recent" },
  { id: "monitoring", label: "Monitoring changes", count: 5, filter: "monitoring" },
];

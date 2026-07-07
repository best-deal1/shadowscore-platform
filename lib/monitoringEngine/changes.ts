import type { BusinessGraphEdge, BusinessGraphNode } from "../businessGraph/types";
import type {
  BusinessMonitoringSnapshot,
  MonitoringCategory,
  MonitoringChange,
  MonitoringSeverity,
} from "./types";

const confidenceRank: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

const normalizeArray = (value?: string[]): string[] =>
  Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

const hasMeaningfulValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
};

const sameValue = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

const pushChange = (
  changes: MonitoringChange[],
  category: MonitoringCategory,
  previousValue: unknown,
  currentValue: unknown,
  severity: MonitoringSeverity,
  explanation: string,
  detectedAt: string,
): void => {
  if (!hasMeaningfulValue(previousValue) && !hasMeaningfulValue(currentValue)) return;
  if (sameValue(previousValue, currentValue)) return;
  changes.push({ category, previousValue, currentValue, severity, explanation, detectedAt });
};

const compareStringArray = (
  changes: MonitoringChange[],
  category: MonitoringCategory,
  previousValue: string[] | undefined,
  currentValue: string[] | undefined,
  severity: MonitoringSeverity,
  explanation: string,
  detectedAt: string,
): void => pushChange(changes, category, normalizeArray(previousValue), normalizeArray(currentValue), severity, explanation, detectedAt);

const nodeSignature = (node: Partial<BusinessGraphNode>): string => `${node.type ?? "Node"}:${node.normalizedValue ?? node.label ?? node.id ?? "unknown"}`;
const edgeSignature = (edge: Partial<BusinessGraphEdge>): string => `${edge.type ?? "edge"}:${edge.from ?? "unknown"}->${edge.to ?? "unknown"}`;

export const compareSnapshots = (
  previousSnapshot: BusinessMonitoringSnapshot,
  currentSnapshot: BusinessMonitoringSnapshot,
  detectedAt = new Date().toISOString(),
): MonitoringChange[] => {
  const changes: MonitoringChange[] = [];

  compareStringArray(changes, "dns", previousSnapshot.dns?.nameServers, currentSnapshot.dns?.nameServers, "high", "Name servers changed.", detectedAt);
  compareStringArray(changes, "dns", previousSnapshot.dns?.mxRecords, currentSnapshot.dns?.mxRecords, "high", "MX records changed.", detectedAt);
  compareStringArray(changes, "dns", previousSnapshot.dns?.aRecords, currentSnapshot.dns?.aRecords, "medium", "A records changed.", detectedAt);
  compareStringArray(changes, "dns", previousSnapshot.dns?.txtRecords, currentSnapshot.dns?.txtRecords, "low", "TXT records changed.", detectedAt);

  pushChange(changes, "whois", previousSnapshot.whois?.registrar, currentSnapshot.whois?.registrar, "medium", "WHOIS registrar changed.", detectedAt);
  pushChange(changes, "whois", previousSnapshot.whois?.registrantOrganization, currentSnapshot.whois?.registrantOrganization, "high", "WHOIS registrant organization changed.", detectedAt);
  compareStringArray(changes, "whois", previousSnapshot.whois?.status, currentSnapshot.whois?.status, "medium", "WHOIS domain status changed.", detectedAt);
  pushChange(changes, "whois", previousSnapshot.whois?.expirationDate, currentSnapshot.whois?.expirationDate, "low", "WHOIS expiration date changed.", detectedAt);

  pushChange(changes, "ssl", previousSnapshot.ssl?.issuer, currentSnapshot.ssl?.issuer, "medium", "SSL issuer changed.", detectedAt);
  pushChange(changes, "ssl", previousSnapshot.ssl?.fingerprint, currentSnapshot.ssl?.fingerprint, "medium", "SSL certificate fingerprint changed.", detectedAt);
  pushChange(changes, "ssl", previousSnapshot.ssl?.validTo, currentSnapshot.ssl?.validTo, "low", "SSL certificate expiration changed.", detectedAt);
  pushChange(changes, "ssl", previousSnapshot.ssl?.grade, currentSnapshot.ssl?.grade, "medium", "SSL grade changed.", detectedAt);

  pushChange(changes, "email", previousSnapshot.email?.businessEmail, currentSnapshot.email?.businessEmail, "high", "Business email changed.", detectedAt);
  compareStringArray(changes, "email", previousSnapshot.email?.mxRecords, currentSnapshot.email?.mxRecords, "high", "Email MX records changed.", detectedAt);
  pushChange(changes, "email", previousSnapshot.email?.spfRecord, currentSnapshot.email?.spfRecord, "medium", "SPF record changed.", detectedAt);
  pushChange(changes, "email", previousSnapshot.email?.dmarcPolicy, currentSnapshot.email?.dmarcPolicy, "medium", "DMARC policy changed.", detectedAt);
  pushChange(changes, "email", previousSnapshot.email?.authenticationStatus, currentSnapshot.email?.authenticationStatus, "high", "Email authentication status changed.", detectedAt);

  const previousIdentityConfidence = previousSnapshot.businessProfile?.identityConfidence;
  const currentIdentityConfidence = currentSnapshot.businessProfile?.identityConfidence;
  if (previousIdentityConfidence && currentIdentityConfidence && confidenceRank[currentIdentityConfidence] < confidenceRank[previousIdentityConfidence]) {
    pushChange(changes, "business_profile", previousIdentityConfidence, currentIdentityConfidence, "high", "Identity confidence decreased.", detectedAt);
  }
  pushChange(changes, "business_profile", previousSnapshot.businessProfile?.businessName, currentSnapshot.businessProfile?.businessName, "high", "Business name changed.", detectedAt);
  pushChange(changes, "business_profile", previousSnapshot.businessProfile?.country, currentSnapshot.businessProfile?.country, "medium", "Business country changed.", detectedAt);

  const previousContradictions = new Set((previousSnapshot.businessProfile?.contradictionSignals ?? []).map((signal) => signal.id));
  const newContradictions = (currentSnapshot.businessProfile?.contradictionSignals ?? []).filter((signal) => !previousContradictions.has(signal.id));
  if (newContradictions.length > 0) {
    pushChange(changes, "business_profile", previousSnapshot.businessProfile?.contradictionSignals ?? [], newContradictions, "high", "New contradiction detected.", detectedAt);
  }

  const previousNodes = normalizeArray((previousSnapshot.graph?.nodes ?? []).map(nodeSignature));
  const currentNodes = normalizeArray((currentSnapshot.graph?.nodes ?? []).map(nodeSignature));
  const previousEdges = normalizeArray((previousSnapshot.graph?.edges ?? []).map(edgeSignature));
  const currentEdges = normalizeArray((currentSnapshot.graph?.edges ?? []).map(edgeSignature));
  pushChange(changes, "graph", { nodes: previousNodes, edges: previousEdges }, { nodes: currentNodes, edges: currentEdges }, "medium", "Business graph changed.", detectedAt);

  pushChange(changes, "reputation", previousSnapshot.reputation?.score, currentSnapshot.reputation?.score, "medium", "Reputation score changed.", detectedAt);
  compareStringArray(changes, "reputation", previousSnapshot.reputation?.flaggedSources, currentSnapshot.reputation?.flaggedSources, "high", "Reputation flagged sources changed.", detectedAt);
  compareStringArray(changes, "reputation", previousSnapshot.reputation?.riskLabels, currentSnapshot.reputation?.riskLabels, "high", "Reputation risk labels changed.", detectedAt);

  return changes;
};

import type { BusinessGraph } from "../businessGraph/types";
import type { BusinessProfile } from "../businessProfileEngine/types";

export type MonitoringCategory = "dns" | "whois" | "ssl" | "email" | "business_profile" | "graph" | "reputation";

export type MonitoringSeverity = "info" | "low" | "medium" | "high" | "critical";

export type MonitoringChange = {
  category: MonitoringCategory;
  previousValue: unknown;
  currentValue: unknown;
  severity: MonitoringSeverity;
  explanation: string;
  detectedAt: string;
};

export type DnsSnapshot = {
  nameServers?: string[];
  mxRecords?: string[];
  aRecords?: string[];
  aaaaRecords?: string[];
  txtRecords?: string[];
  cnameRecords?: string[];
};

export type WhoisSnapshot = {
  registrar?: string;
  registrantOrganization?: string;
  registrantCountry?: string;
  registrationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  status?: string[];
};

export type SslSnapshot = {
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  fingerprint?: string;
  protocol?: string;
  grade?: string;
};

export type EmailSnapshot = {
  businessEmail?: string;
  mxRecords?: string[];
  spfRecord?: string;
  dkimSelectors?: string[];
  dmarcPolicy?: string;
  authenticationStatus?: "pass" | "partial" | "fail" | "unknown";
};

export type ReputationSnapshot = {
  score?: number;
  rating?: string;
  flaggedSources?: string[];
  riskLabels?: string[];
};

export type BusinessMonitoringSnapshot = {
  id: string;
  target: string;
  capturedAt: string;
  dns?: DnsSnapshot;
  whois?: WhoisSnapshot;
  ssl?: SslSnapshot;
  email?: EmailSnapshot;
  businessProfile?: Partial<BusinessProfile>;
  graph?: Partial<BusinessGraph>;
  reputation?: ReputationSnapshot;
  metadata?: Record<string, unknown>;
};

export type CreateSnapshotInput = Omit<BusinessMonitoringSnapshot, "id" | "capturedAt"> & {
  id?: string;
  capturedAt?: string;
};

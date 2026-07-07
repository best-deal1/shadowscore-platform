import type { BusinessMonitoringSnapshot, CreateSnapshotInput } from "./types";

const createSnapshotId = (target: string, capturedAt: string): string => {
  const normalizedTarget = target.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "target";
  return `${normalizedTarget}-${capturedAt.replace(/[^0-9]/g, "")}`;
};

export const createBusinessSnapshot = (input: CreateSnapshotInput): BusinessMonitoringSnapshot => {
  const capturedAt = input.capturedAt ?? new Date().toISOString();

  return {
    id: input.id ?? createSnapshotId(input.target, capturedAt),
    target: input.target,
    capturedAt,
    dns: input.dns,
    whois: input.whois,
    ssl: input.ssl,
    email: input.email,
    businessProfile: input.businessProfile,
    graph: input.graph,
    reputation: input.reputation,
    metadata: input.metadata,
  };
};

export const samplePreviousSnapshot: BusinessMonitoringSnapshot = createBusinessSnapshot({
  id: "acme-shop-2026-07-01",
  target: "acme-shop.example",
  capturedAt: "2026-07-01T12:00:00.000Z",
  dns: {
    nameServers: ["ns1.old-dns.example", "ns2.old-dns.example"],
    mxRecords: ["10 mail.oldmail.example"],
    aRecords: ["203.0.113.10"],
  },
  whois: {
    registrar: "Example Registrar LLC",
    registrantOrganization: "Acme Shop LLC",
    registrantCountry: "US",
    expirationDate: "2027-07-01",
  },
  ssl: {
    issuer: "Example CA",
    validTo: "2026-10-01T00:00:00.000Z",
    fingerprint: "AA:BB:CC",
    grade: "A",
  },
  email: {
    businessEmail: "support@acme-shop.example",
    mxRecords: ["10 mail.oldmail.example"],
    spfRecord: "v=spf1 include:oldmail.example ~all",
    dmarcPolicy: "p=quarantine",
    authenticationStatus: "pass",
  },
  businessProfile: {
    businessName: "Acme Shop LLC",
    primaryDomain: "acme-shop.example",
    country: "US",
    identityConfidence: "High",
    contradictionSignals: [],
  },
  graph: {
    nodes: [
      { id: "business:acme", type: "Business", label: "Acme Shop LLC", normalizedValue: "acme shop llc", source: "profile", confidence: "High", reliability: "High", evidence: [] },
      { id: "domain:acme", type: "Domain", label: "acme-shop.example", normalizedValue: "acme-shop.example", source: "dns", confidence: "High", reliability: "High", evidence: [] },
    ],
    edges: [{ id: "edge:owns", type: "owns", from: "business:acme", to: "domain:acme", reason: "Primary domain", evidence: [], confidence: "High" }],
  },
});

export const sampleCurrentSnapshot: BusinessMonitoringSnapshot = createBusinessSnapshot({
  id: "acme-shop-2026-07-07",
  target: "acme-shop.example",
  capturedAt: "2026-07-07T12:00:00.000Z",
  dns: {
    nameServers: ["ns1.new-dns.example", "ns2.new-dns.example"],
    mxRecords: ["10 mail.newmail.example"],
    aRecords: ["203.0.113.10"],
  },
  whois: {
    registrar: "Example Registrar LLC",
    registrantOrganization: "Acme Shop LLC",
    registrantCountry: "US",
    expirationDate: "2027-07-01",
  },
  ssl: {
    issuer: "Example CA",
    validTo: "2026-10-01T00:00:00.000Z",
    fingerprint: "AA:BB:CC",
    grade: "A",
  },
  email: {
    businessEmail: "trust@acme-shop.example",
    mxRecords: ["10 mail.newmail.example"],
    spfRecord: "v=spf1 include:newmail.example ~all",
    dmarcPolicy: "p=quarantine",
    authenticationStatus: "pass",
  },
  businessProfile: {
    businessName: "Acme Shop LLC",
    primaryDomain: "acme-shop.example",
    country: "US",
    identityConfidence: "Medium",
    contradictionSignals: [
      {
        id: "email-owner-mismatch",
        title: "Business email owner mismatch",
        evidence: ["Observed trust@acme-shop.example after support@acme-shop.example"],
        interpretation: "The business contact point changed during monitoring.",
        businessMeaning: "A reviewer should confirm whether the new contact channel is authorized.",
        severity: "medium",
      },
    ],
  },
  graph: {
    nodes: [
      { id: "business:acme", type: "Business", label: "Acme Shop LLC", normalizedValue: "acme shop llc", source: "profile", confidence: "Medium", reliability: "High", evidence: [] },
      { id: "domain:acme", type: "Domain", label: "acme-shop.example", normalizedValue: "acme-shop.example", source: "dns", confidence: "High", reliability: "High", evidence: [] },
      { id: "email:trust", type: "Email", label: "trust@acme-shop.example", normalizedValue: "trust@acme-shop.example", source: "email", confidence: "Medium", reliability: "Medium", evidence: [] },
    ],
    edges: [
      { id: "edge:owns", type: "owns", from: "business:acme", to: "domain:acme", reason: "Primary domain", evidence: [], confidence: "High" },
      { id: "edge:uses-email", type: "uses", from: "business:acme", to: "email:trust", reason: "Observed business email", evidence: [], confidence: "Medium" },
    ],
  },
});

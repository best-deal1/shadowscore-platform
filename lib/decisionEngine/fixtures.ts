import { buildVerificationDecision } from "./model";
import type { ProviderResult } from "../providers/types";

function result(providerId: string, records: Record<string, string[]> = {}, findings: ProviderResult["findings"] = []): ProviderResult {
  const now = "2026-07-08T00:00:00.000Z";
  return {
    providerId,
    providerVersion: "fixture-v1",
    status: "completed",
    startedAt: now,
    completedAt: now,
    duration: 0,
    findings,
    evidence: Object.entries(records).map(([type, values]) => ({ id: `${providerId}-${type}`, type: "configuration", label: `${type} record`, value: values.join(", "), source: "fixture" })),
    metadata: { records, registrationDate: providerId === "whois" ? "2015-01-01" : undefined, ageDays: providerId === "whois" ? 4200 : undefined },
    errors: [],
  };
}

export const verificationDecisionFixtures = {
  knownStrongSite: {
    label: "known strong site",
    providerResults: [
      result("dns", { A: ["203.0.113.10"], NS: ["ns1.example.com"], MX: ["mail.example.com"], TXT: ["v=spf1 include:_spf.example.com -all", "v=DMARC1; p=reject"] }),
      result("whois"),
      result("reputation"),
    ],
  },
  knownSmallBusiness: {
    label: "known small business",
    providerResults: [
      result("dns", { A: ["203.0.113.20"], NS: ["ns1.host.test"], MX: ["mail.host.test"], TXT: ["v=spf1 include:host.test ~all"] }),
      result("whois"),
    ],
  },
  dnsOnlyDomain: {
    label: "DNS-only domain",
    providerResults: [result("dns", { A: ["203.0.113.30"], NS: ["ns1.dns.test"] })],
  },
  fakeNewDomain: {
    label: "fake/new domain",
    providerResults: [
      result("dns", { A: ["203.0.113.40"] }, [{ id: "new-domain", title: "New disposable domain pattern", description: "Domain pattern needs manual review.", severity: "high" }]),
    ],
  },
  marketplaceSeller: {
    label: "marketplace seller",
    providerResults: [
      result("dns", { A: ["203.0.113.50"], NS: ["ns1.market.test"], MX: ["mail.market.test"], TXT: ["v=spf1 include:market.test -all"] }),
      result("marketplace", { Seller: ["verified seller profile"] }),
    ],
  },
  emailOnlyInput: {
    label: "email-only input",
    providerResults: [result("dns", { MX: ["mail.email.test"], TXT: ["v=spf1 include:email.test ~all"] })],
  },
} as const;

export const verificationDecisionFixtureOutputs = Object.fromEntries(
  Object.entries(verificationDecisionFixtures).map(([id, fixture]) => [
    id,
    { label: fixture.label, output: buildVerificationDecision({ providerResults: [...fixture.providerResults], audience: "free" }) },
  ]),
);

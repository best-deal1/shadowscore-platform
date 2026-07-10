import { buildVerificationDecision, type VerificationDecision } from "./model";
import type { ProviderResult } from "../providers/types";

function result(providerId: string, records: Record<string, string[]> = {}, findings: ProviderResult["findings"] = [], status: ProviderResult["status"] = "completed"): ProviderResult {
  const now = "2026-07-10T00:00:00.000Z";
  return {
    providerId,
    providerVersion: "validation-v1",
    status,
    startedAt: now,
    completedAt: now,
    duration: 0,
    findings,
    evidence: Object.entries(records).map(([type, values]) => ({ id: `${providerId}-${type}`, type: "configuration", label: `${type} record`, value: values.join(", "), source: "validation" })),
    metadata: { records, registrationDate: providerId === "whois" ? "2015-01-01" : undefined, ageDays: providerId === "whois" ? 4200 : undefined },
    errors: status === "failed" ? ["provider unavailable"] : [],
  };
}

const strongBusiness = (name: string) => ({
  label: name,
  providerResults: [
    result("dns", { A: ["203.0.113.10"], NS: ["ns1.example.com"], MX: ["mail.example.com"], TXT: ["v=spf1 include:_spf.example.com -all", "v=DMARC1; p=reject"] }),
    result("whois"),
    result("reputation"),
  ],
});

export const decisionValidationCases = [

  { label: "Trusted enterprise", providerResults: strongBusiness("Trusted Enterprise").providerResults, expected: ["PASS"] as VerificationDecision[] },
  { label: "New business", providerResults: [result("dns", { A: ["203.0.113.70"] }), result("whois", {})], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "Provider failure", providerResults: [result("dns", {}, [], "failed")], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "Missing ownership", providerResults: [result("dns", { A: ["203.0.113.80"], NS: ["ns1.host.test"] }), result("whois", {})], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "Known enforcement", providerResults: [result("marketplace", {}, [{ id: "known-enforcement", title: "Known enforcement action", description: "Verified marketplace enforcement notice was supplied.", severity: "high" }])], expected: ["FAIL"] as VerificationDecision[] },
  { label: "Negative evidence", providerResults: [result("reputation", {}, [{ id: "confirmed-fraud", title: "Confirmed fraud evidence", description: "Confirmed fraud signal from reputation evidence.", severity: "critical" }])], expected: ["FAIL"] as VerificationDecision[] },
  { ...strongBusiness("Apple"), expected: ["PASS"] as VerificationDecision[] },
  { ...strongBusiness("Microsoft"), expected: ["PASS"] as VerificationDecision[] },
  { ...strongBusiness("Amazon"), expected: ["PASS"] as VerificationDecision[] },
  { ...strongBusiness("Cloudflare"), expected: ["PASS"] as VerificationDecision[] },
  { label: "KSP", providerResults: [result("dns", { A: ["203.0.113.20"], NS: ["ns1.host.test"], MX: ["mail.host.test"], TXT: ["v=spf1 include:host.test ~all"] }), result("whois")], expected: ["REVIEW", "PASS"] as VerificationDecision[] },
  { label: "C-Data", providerResults: [result("dns", { A: ["203.0.113.30"], NS: ["ns1.host.test"] }), result("reputation")], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "GadgetDeals", providerResults: [result("dns", { A: ["203.0.113.40"], MX: ["mail.host.test"] })], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "New domain", providerResults: [result("dns", { A: ["203.0.113.50"] }), result("whois", {})], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "Missing data only", providerResults: [], expected: ["REVIEW"] as VerificationDecision[] },
  { label: "Known phishing domain", providerResults: [result("dns", { A: ["203.0.113.60"] }, [{ id: "known-phishing", title: "Known phishing infrastructure", description: "Verified phishing signal from reputation evidence.", severity: "critical" }])], expected: ["FAIL"] as VerificationDecision[] },
  { label: "Known malicious domain", providerResults: [result("reputation", {}, [{ id: "known-malicious", title: "Known malicious infrastructure", description: "Confirmed malicious infrastructure reputation issue.", severity: "high" }])], expected: ["FAIL"] as VerificationDecision[] },
] as const;

export function runDecisionValidationSuite() {
  return decisionValidationCases.map((testCase) => {
    const output = buildVerificationDecision({ providerResults: [...testCase.providerResults], audience: "paid" });
    const passed = testCase.expected.includes(output.decision);
    return {
      label: testCase.label,
      expected: testCase.expected.join(" or "),
      actual: output.decision,
      passed,
      why: output.reasons,
      counts: {
        positiveEvidenceCount: output.positiveEvidenceCount,
        missingEvidenceCount: output.missingEvidenceCount,
        negativeEvidenceCount: output.negativeEvidenceCount,
        verificationConfidence: output.verificationConfidence,
        evidenceCompleteness: output.evidenceCompleteness,
      },
    };
  });
}

export const decisionAlgorithmSummary = [
  "PASS requires sufficient positive evidence and zero confirmed negative evidence.",
  "REVIEW is used for missing evidence, incomplete provider coverage, or insufficient confidence when negative evidence is absent.",
  "FAIL requires at least one verified negative condition; missing evidence alone cannot produce FAIL.",
  "Verification confidence and evidence completeness are reported separately from risk/negative evidence.",
];

export const beforeAfterDecisionMatrix = [
  { scenario: "Missing data only", before: "Could reduce score below FAIL threshold", after: "REVIEW because missing evidence is incomplete coverage, not risk" },
  { scenario: "Incomplete provider coverage", before: "Could be treated as a critical failed check", after: "REVIEW unless verified negative evidence exists" },
  { scenario: "Strong positive evidence", before: "PASS only if score thresholds survive missing-signal penalties", after: "PASS when positive evidence is sufficient and negative evidence count is zero" },
  { scenario: "Verified phishing/malicious/reputation issue", before: "FAIL through score or blocking issue", after: "FAIL through explicit verified negative evidence" },
];

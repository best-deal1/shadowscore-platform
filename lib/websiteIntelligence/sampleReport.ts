import type { CanonicalWebsiteReport } from "./canonicalReport";
import { WEBSITE_REPORT_SCHEMA_VERSION } from "./canonicalReport";

const observedAt = "2026-07-25T10:00:00.000Z";

/** Stable demonstration data for the public sample route. */
export const sampleWebsiteIntelligenceReport: CanonicalWebsiteReport = {
  schemaVersion: WEBSITE_REPORT_SCHEMA_VERSION,
  reportType: "website-intelligence",
  subject: { domain: "example.com" },
  generatedAt: observedAt,
  status: "partial",
  summary: "The website responded over HTTPS. The demonstration records one browser security header gap and one unavailable provider.",
  coverage: { completedModules: 2, totalModules: 3, percent: 67 },
  assessments: [
    { id: "technical-health", title: "Technical health", summary: "The website returned a successful HTTPS response." },
    { id: "security-posture", title: "Security posture", summary: "One recommended browser security header requires review." },
    { id: "infrastructure-maturity", title: "Infrastructure maturity", summary: "This sample does not include infrastructure checks." },
    { id: "trust-indicators", title: "Website trust indicators", summary: "Reputation evidence is unavailable in this sample." },
  ],
  modules: [
    { id: "http", name: "HTTP Intelligence", status: "completed", source: "Website response", confidence: 0.9, summary: "The website returned a successful HTTPS response." },
    { id: "security_headers", name: "Security Headers", status: "completed", source: "HTTPS response headers", confidence: 0.9, summary: "A recommended browser security header was not published." },
    { id: "reputation", name: "Reputation", status: "unavailable", source: "Website Intelligence configuration", confidence: 0, summary: "Reputation provider evidence was unavailable." },
  ],
  evidence: [
    { id: "http:http:status", moduleId: "http", label: "HTTPS response status", value: "200", source: "HTTPS response", observedAt, availability: "observed" },
    { id: "security_headers:headers:content-security-policy", moduleId: "security_headers", label: "content-security-policy", value: "Not published", source: "HTTPS response headers", observedAt, availability: "observed" },
    { id: "reputation:reputation:availability", moduleId: "reputation", label: "Reputation provider", value: "No configured reputation provider", source: "Website Intelligence configuration", observedAt, availability: "unavailable" },
  ],
  findings: [
    { id: "security_headers:headers:missing", moduleId: "security_headers", title: "Security headers need review", statement: "One recommended browser security header was not published.", severity: "low", businessImpact: "Browser protections may be less consistent for website visitors.", recommendation: "Review the missing browser security header with the website team.", evidenceIds: ["security_headers:headers:content-security-policy"] },
    { id: "reputation:reputation:unavailable", moduleId: "reputation", title: "Reputation evidence is unavailable", statement: "No reputation provider was available for this demonstration.", severity: "info", businessImpact: "An evidence gap remains for known malware and phishing indicators.", recommendation: "Use an approved threat intelligence provider before relying on reputation evidence.", evidenceIds: ["reputation:reputation:availability"] },
  ],
  recommendedActions: ["Review the missing browser security header with the website team."],
  limitations: ["Reputation: Reputation provider evidence was unavailable."],
};

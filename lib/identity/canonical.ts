import type { CompanyType } from "../canonicalDecision";

export type EvidenceAuthorityCategory = "government_registry" | "sec_or_exchange" | "official_regulator" | "official_website_legal" | "verified_domain_relationship" | "dns_email_infrastructure" | "whois" | "schema_org" | "metadata_page_title" | "inferred_heuristic" | "unknown";
export type CanonicalIdentityStatus = "SUPPORTED" | "PARTIAL" | "CONFLICTED" | "UNRESOLVED";
export type ConfidenceLabel = "High" | "Medium" | "Low" | "Unknown";

export type CanonicalIdentity = {
  canonicalDisplayName: string;
  brandName?: string;
  legalName?: string;
  parentOrganization?: string;
  primaryDomain?: string;
  companyType: CompanyType;
  identityConfidence: { score: number; label: ConfidenceLabel };
  identityStatus: CanonicalIdentityStatus;
  supportingSources: string[];
  evidenceCategories: EvidenceAuthorityCategory[];
  corroborationCount: number;
  hasAuthoritativeSource: boolean;
  contradictorySourceCount: number;
  legalNameSupported: boolean;
  domainDerivedFallback: boolean;
};

export const EVIDENCE_PRIORITY: Array<{ rank: number; category: EvidenceAuthorityCategory; label: string }> = [
  { rank: 1, category: "government_registry", label: "Government registry" },
  { rank: 2, category: "sec_or_exchange", label: "SEC or official exchange" },
  { rank: 3, category: "official_regulator", label: "Official regulator" },
  { rank: 4, category: "official_website_legal", label: "Official website legal disclosures" },
  { rank: 5, category: "verified_domain_relationship", label: "Verified domain relationship" },
  { rank: 6, category: "dns_email_infrastructure", label: "DNS and email infrastructure" },
  { rank: 7, category: "whois", label: "WHOIS" },
  { rank: 8, category: "schema_org", label: "schema.org" },
  { rank: 9, category: "metadata_page_title", label: "metadata and page title" },
  { rank: 10, category: "inferred_heuristic", label: "inferred or heuristic evidence" },
];

export function cleanPageTitle(input?: string) {
  let value = String(input || "").replace(/&amp;/g, "&").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
  if (!value) return "";
  const parts = value.split(/\s*(?:\||\u2014|–|-|:|•|»|\/)\s*/).map((part) => part.trim()).filter(Boolean);
  const repeated = parts.find((part, index) => parts.findIndex((other) => other.toLowerCase() === part.toLowerCase()) !== index);
  const suffixBrand = parts.length > 1 && parts[parts.length - 1].length <= 24 && parts[0].toLowerCase().includes(parts[parts.length - 1].toLowerCase()) ? parts[parts.length - 1] : undefined;
  if (repeated || suffixBrand) value = repeated || suffixBrand || value;
  else value = parts.length ? (parts[parts.length - 1].length <= 24 && parts[0].length > 24 ? parts[parts.length - 1] : parts[0]) : value;
  value = value.replace(/\b(the )?(all[- ]in[- ]one|leader in|financial infrastructure|ai workspace|commerce platform|official website|homepage|solutions?|platform)\b.*$/i, "").trim();
  return value.replace(/\s+/g, " ").replace(/[|:;,.\-–\u2014]+$/g, "").trim();
}

export function brandFromLegalName(legalName?: string) {
  return String(legalName || "").replace(/\b(incorporated|inc\.?|corp\.?|corporation|ltd\.?|limited|plc|llc|co\.?|company)\b/gi, "").replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}

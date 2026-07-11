import type { EvidenceItem } from "../evidence/types";
import { resolveIdentities } from "./resolver";

const item = (id: string, refs: EvidenceItem["evidenceRefs"]): EvidenceItem => ({
  id,
  source: "identity-example",
  provider: "normalized-evidence",
  category: "Verified",
  status: "observed",
  confidence: 95,
  title: id,
  description: "Normalized evidence item used for identity resolution examples.",
  businessImpact: "Demonstrates deterministic identity linkage.",
  evidenceRefs: refs,
});

export const identityResolutionExampleEvidence: EvidenceItem[] = [
  item("enterprise", [
    { id: "enterprise-name", type: "finding", label: "Business Name", value: "Acme Corporation", source: "normalized" },
    { id: "enterprise-domain", type: "provider", label: "Domain", value: "https://www.acme.com", source: "normalized" },
    { id: "enterprise-email", type: "provider", label: "Email", value: "trust@acme.com", source: "normalized" },
  ]),
  item("small-business", [
    { id: "small-name", type: "finding", label: "Business Name", value: "Jane's Bakery LLC", source: "normalized" },
    { id: "small-phone", type: "provider", label: "Phone", value: "+1 (415) 555-0101", source: "normalized" },
    { id: "small-social", type: "provider", label: "Social Profile", value: "https://instagram.com/janesbakery", source: "normalized" },
  ]),
  item("marketplace-alias", [
    { id: "market-name", type: "finding", label: "Business Name", value: "Jane's Bakery", source: "normalized" },
    { id: "market-account", type: "provider", label: "Marketplace Seller", value: "https://etsy.com/shop/janesbakery", source: "normalized" },
  ]),
];

export const identityResolutionExamples = resolveIdentities({ evidenceItems: identityResolutionExampleEvidence });

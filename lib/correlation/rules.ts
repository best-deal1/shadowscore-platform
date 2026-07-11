import { emailDomain, isConsumerEmailDomain, normalizeDomain, normalizeText } from "./relationships";
import type { CorrelationContradiction, CorrelationEndpoint, CorrelationFinding, EvidenceFacts, RelationshipKind } from "./types";

function confidence(classification: CorrelationFinding["classification"], size: number) {
  if (classification === "Confirmed") return Math.min(98, 82 + size * 4);
  if (classification === "Likely") return Math.min(79, 60 + size * 5);
  if (classification === "Contradiction") return 90;
  return 0;
}

function finding(relationship: RelationshipKind, title: string, classification: CorrelationFinding["classification"], evidence: CorrelationEndpoint[], explanation: string, contradiction?: CorrelationContradiction): CorrelationFinding {
  return { id: `corr:${relationship}:${normalizeText(title).replace(/\s+/g, "-")}`, relationship, title, classification, confidence: confidence(classification, evidence.length), evidence, explanation, contradiction };
}

function contradiction(relationship: RelationshipKind, title: string, evidence: CorrelationEndpoint[], explanation: string, severity: CorrelationContradiction["severity"] = "high"): CorrelationContradiction {
  return { id: `contradiction:${relationship}:${normalizeText(title).replace(/\s+/g, "-")}`, relationship, title, classification: "Contradiction", severity, evidence, explanation };
}

function anySame(left: CorrelationEndpoint[], right: CorrelationEndpoint[], normalizer = normalizeText) {
  const rightValues = new Set(right.map((item) => normalizer(item.value)).filter(Boolean));
  return left.find((item) => rightValues.has(normalizer(item.value)));
}

function anyDifferent(left: CorrelationEndpoint[], right: CorrelationEndpoint[], normalizer = normalizeText) {
  if (left.length === 0 || right.length === 0) return false;
  return !anySame(left, right, normalizer);
}

export function evaluateCorrelationRules(facts: EvidenceFacts, options: { targetType?: string } = {}): CorrelationFinding[] {
  const findings: CorrelationFinding[] = [];

  if (facts.businessNames.length && facts.registryNames.length) {
    const same = anySame(facts.businessNames, facts.registryNames);
    if (same) findings.push(finding("business_registry", "Business Name matches Registry", "Confirmed", [same, ...facts.registryNames], "Business identity evidence aligns with registry evidence."));
    else {
      const c = contradiction("company_name_consistency", "Company name differs across providers", [...facts.businessNames, ...facts.registryNames], "Business name evidence and registry evidence point to different company names.");
      findings.push(finding("company_name_consistency", c.title, "Contradiction", c.evidence, c.explanation, c));
    }
  } else findings.push(finding("business_registry", "Business registry relationship missing", "Unknown", [...facts.businessNames, ...facts.registryNames], "Business name and registry evidence were not both present."));

  const emailDomains = facts.emails.map((item) => ({ ...item, value: emailDomain(item.value) })).filter((item) => item.value);
  const websiteDomains = [...facts.websites, ...facts.domains].map((item) => ({ ...item, value: normalizeDomain(item.value) })).filter((item) => item.value);
  if (emailDomains.length && websiteDomains.length) {
    const same = anySame(emailDomains, websiteDomains, normalizeDomain);
    if (same && !isConsumerEmailDomain(same.value)) findings.push(finding("email_domain_website", "Email domain matches Website", "Confirmed", [same, ...websiteDomains], "The contact email uses the same domain as the website evidence."));
    else {
      const c = contradiction("email_domain_website", "Email domain differs from Website", [...emailDomains, ...websiteDomains], "Email evidence does not share the website domain, or uses a consumer mailbox where a domain mailbox was expected.", "medium");
      findings.push(finding("email_domain_website", c.title, "Contradiction", c.evidence, c.explanation, c));
    }
  } else findings.push(finding("email_domain_website", "Email-to-website relationship missing", "Unknown", [...emailDomains, ...websiteDomains], "Email and website evidence were not both present."));

  if (facts.phones.length && (facts.businessNames.length || facts.registryNames.length)) findings.push(finding("phone_business", "Phone matches Business", "Likely", [...facts.phones, ...facts.businessNames, ...facts.registryNames], "Phone evidence appears alongside business identity evidence."));
  else findings.push(finding("phone_business", "Phone-to-business relationship missing", "Unknown", facts.phones, "Phone evidence was not correlated with business identity evidence."));

  if (facts.dnsHosts.length && facts.sslHosts.length) {
    const same = anySame(facts.dnsHosts, facts.sslHosts, normalizeDomain);
    if (same) findings.push(finding("dns_ssl", "DNS matches SSL", "Confirmed", [same, ...facts.sslHosts], "DNS host evidence aligns with SSL/TLS host evidence."));
    else {
      const c = contradiction("dns_ssl", "Domain mismatch between DNS and SSL", [...facts.dnsHosts, ...facts.sslHosts], "DNS evidence and SSL evidence point to different domains.");
      findings.push(finding("dns_ssl", c.title, "Contradiction", c.evidence, c.explanation, c));
    }
  } else findings.push(finding("dns_ssl", "DNS-to-SSL relationship missing", "Unknown", [...facts.dnsHosts, ...facts.sslHosts], "DNS and SSL evidence were not both present."));

  const marketplaceApplicable = options.targetType === "marketplaceSeller" || facts.marketplaceSellers.some((item) => /marketplace|seller|store/i.test(item.source) && !/business-profile|website-metadata|http-response|node:dns|tls-certificate/i.test(item.source));
  if (marketplaceApplicable && facts.marketplaceSellers.length && (facts.businessNames.length || facts.registryNames.length)) {
    const names = [...facts.businessNames, ...facts.registryNames];
    if (facts.marketplaceSellers.length >= 1 && names.length >= 1 && anyDifferent(facts.marketplaceSellers, names)) {
      const c = contradiction("marketplace_seller_company", "Marketplace seller differs from company", [...facts.marketplaceSellers, ...names], "Marketplace seller evidence does not align with company evidence.");
      findings.push(finding("marketplace_seller_company", c.title, "Contradiction", c.evidence, c.explanation, c));
    } else findings.push(finding("marketplace_seller_company", "Marketplace seller matches company", "Confirmed", [...facts.marketplaceSellers, ...names], "Marketplace seller evidence aligns with company evidence."));
  } else if (marketplaceApplicable) findings.push(finding("marketplace_seller_company", "Marketplace seller relationship missing", "Unknown", facts.marketplaceSellers, "Marketplace seller and company evidence were not both present."));

  const paymentApplicable = facts.paymentAccounts.length > 0 || options.targetType === "payment";
  if (paymentApplicable && facts.paymentAccounts.length && (facts.businessNames.length || facts.registryNames.length)) findings.push(finding("payment_account_entity", "Payment account belongs to same entity", "Likely", [...facts.paymentAccounts, ...facts.businessNames, ...facts.registryNames], "Payment account evidence appears connected to the same named entity."));
  else if (paymentApplicable) findings.push(finding("payment_account_entity", "Payment account relationship missing", "Unknown", facts.paymentAccounts, "Payment account evidence could not be correlated to entity evidence."));

  if (facts.fraudSignals.length || facts.negativeSignals.length) {
    const c = contradiction("fraud_reputation", "Known fraud or negative reputation evidence present", [...facts.fraudSignals, ...facts.negativeSignals], "Negative evidence conflicts with a trusted-company conclusion.", "critical");
    findings.push(finding("fraud_reputation", c.title, "Contradiction", c.evidence, c.explanation, c));
  }

  return findings;
}

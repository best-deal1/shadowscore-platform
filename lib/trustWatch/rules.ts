import type { TrustWatchBusiness, TrustWatchRule, TrustWatchRuleType } from "./types";

export const defaultTrustWatchRules: TrustWatchRule[] = [
  {
    id: "rule_identity_changed",
    type: "identity_changed",
    label: "Identity changed",
    priority: "critical",
    enabled: true,
    recommendedAction: "Review the business identity details and verify the change with an authoritative source.",
  },
  {
    id: "rule_dns_changed",
    type: "dns_changed",
    label: "DNS changed",
    priority: "warning",
    enabled: true,
    recommendedAction: "Confirm the DNS change was planned and inspect records for takeover or routing risk.",
  },
  {
    id: "rule_ssl_expired",
    type: "ssl_expired",
    label: "SSL expired",
    priority: "critical",
    enabled: true,
    recommendedAction: "Renew or replace the certificate before users submit sensitive information.",
  },
  {
    id: "rule_email_changed",
    type: "email_changed",
    label: "Email changed",
    priority: "warning",
    enabled: true,
    recommendedAction: "Validate the new contact email and check whether mail routing or ownership changed.",
  },
  {
    id: "rule_new_contradiction",
    type: "new_contradiction",
    label: "New contradiction",
    priority: "warning",
    enabled: true,
    recommendedAction: "Investigate the conflicting evidence and update the trust record with the resolved finding.",
  },
  {
    id: "rule_reputation_worsened",
    type: "reputation_worsened",
    label: "Reputation worsened",
    priority: "warning",
    enabled: true,
    recommendedAction: "Review the latest reputation signals and decide whether to pause or downgrade trust.",
  },
  {
    id: "rule_graph_changed",
    type: "graph_changed",
    label: "Graph changed",
    priority: "info",
    enabled: true,
    recommendedAction: "Review the graph delta and confirm newly connected entities are expected.",
  },
];

export function findRule(rules: TrustWatchRule[], type: TrustWatchRuleType): TrustWatchRule | undefined {
  return rules.find((rule) => rule.type === type && rule.enabled);
}

export function hasChanged(previousValue: unknown, currentValue: unknown): boolean {
  return JSON.stringify(previousValue ?? null) !== JSON.stringify(currentValue ?? null);
}

export function isSslExpired(business: TrustWatchBusiness, evaluatedAt: string): boolean {
  if (!business.ssl?.expiresAt) {
    return false;
  }

  return new Date(business.ssl.expiresAt).getTime() <= new Date(evaluatedAt).getTime();
}

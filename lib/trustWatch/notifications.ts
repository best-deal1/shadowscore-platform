import type {
  TrustWatchBusiness,
  TrustWatchNotification,
  TrustWatchRule,
  TrustWatchRuleType,
} from "./types";

function notificationId(ruleType: TrustWatchRuleType, businessId: string, timestamp: string): string {
  return `tw_${ruleType}_${businessId}_${timestamp.replace(/[^0-9]/g, "")}`;
}

export function createTrustWatchNotification(params: {
  rule: TrustWatchRule;
  business: TrustWatchBusiness;
  summary: string;
  reason: string;
  timestamp: string;
}): TrustWatchNotification {
  return {
    id: notificationId(params.rule.type, params.business.id, params.timestamp),
    priority: params.rule.priority,
    title: params.rule.label,
    summary: params.summary,
    affectedBusiness: params.business,
    reason: params.reason,
    timestamp: params.timestamp,
    recommendedAction: params.rule.recommendedAction,
    ruleType: params.rule.type,
  };
}

export const sampleTrustWatchNotification: TrustWatchNotification = {
  id: "tw_dns_changed_acme_20260707090000",
  priority: "warning",
  title: "DNS changed",
  summary: "Acme Supply Co. has new DNS records compared with the previous monitoring run.",
  affectedBusiness: {
    id: "acme",
    name: "Acme Supply Co.",
    domain: "acme.example",
  },
  reason: "The monitored DNS fingerprint changed from ns1.old.example to ns1.new.example.",
  timestamp: "2026-07-07T09:00:00.000Z",
  recommendedAction: "Confirm the DNS change was planned and inspect records for takeover or routing risk.",
  ruleType: "dns_changed",
};

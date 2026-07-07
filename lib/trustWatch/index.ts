import { createTrustWatchNotification } from "./notifications";
import { findRule, hasChanged, isSslExpired } from "./rules";
import type { TrustWatchBusiness, TrustWatchEvaluationInput, TrustWatchNotification } from "./types";

function byBusinessId(businesses: TrustWatchBusiness[]): Map<string, TrustWatchBusiness> {
  return new Map(businesses.map((business) => [business.id, business]));
}

function addedContradictions(previous?: string[], current?: string[]): string[] {
  const previousSet = new Set(previous ?? []);
  return (current ?? []).filter((contradiction) => !previousSet.has(contradiction));
}

export function evaluateTrustWatchRules(input: TrustWatchEvaluationInput): TrustWatchNotification[] {
  const timestamp = input.evaluatedAt ?? new Date().toISOString();
  const previousById = byBusinessId(input.previousBusinesses);
  const notifications: TrustWatchNotification[] = [];

  for (const currentBusiness of input.currentBusinesses) {
    const previousBusiness = previousById.get(currentBusiness.id);

    if (!previousBusiness) {
      continue;
    }

    const identityRule = findRule(input.watchlist.rules, "identity_changed");
    if (identityRule && hasChanged(previousBusiness.identity, currentBusiness.identity)) {
      notifications.push(
        createTrustWatchNotification({
          rule: identityRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has identity details that changed since the last monitoring run.`,
          reason: "The stored identity fingerprint no longer matches the current identity fingerprint.",
          timestamp,
        }),
      );
    }

    const dnsRule = findRule(input.watchlist.rules, "dns_changed");
    if (dnsRule && hasChanged(previousBusiness.dns, currentBusiness.dns)) {
      notifications.push(
        createTrustWatchNotification({
          rule: dnsRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has DNS records that changed since the last monitoring run.`,
          reason: "The monitored DNS fingerprint changed.",
          timestamp,
        }),
      );
    }

    const sslRule = findRule(input.watchlist.rules, "ssl_expired");
    if (sslRule && isSslExpired(currentBusiness, timestamp)) {
      notifications.push(
        createTrustWatchNotification({
          rule: sslRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has an expired SSL certificate.`,
          reason: `The certificate expiration time is ${currentBusiness.ssl?.expiresAt}.`,
          timestamp,
        }),
      );
    }

    const emailRule = findRule(input.watchlist.rules, "email_changed");
    if (emailRule && hasChanged(previousBusiness.email, currentBusiness.email)) {
      notifications.push(
        createTrustWatchNotification({
          rule: emailRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has a changed monitored email address.`,
          reason: `The email changed from ${previousBusiness.email ?? "unknown"} to ${currentBusiness.email ?? "unknown"}.`,
          timestamp,
        }),
      );
    }

    const contradictionRule = findRule(input.watchlist.rules, "new_contradiction");
    const newContradictions = addedContradictions(previousBusiness.contradictions, currentBusiness.contradictions);
    if (contradictionRule && newContradictions.length > 0) {
      notifications.push(
        createTrustWatchNotification({
          rule: contradictionRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has ${newContradictions.length} new contradiction signal(s).`,
          reason: `New contradiction(s): ${newContradictions.join(", ")}.`,
          timestamp,
        }),
      );
    }

    const reputationRule = findRule(input.watchlist.rules, "reputation_worsened");
    if (
      reputationRule &&
      typeof previousBusiness.reputationScore === "number" &&
      typeof currentBusiness.reputationScore === "number" &&
      currentBusiness.reputationScore < previousBusiness.reputationScore
    ) {
      notifications.push(
        createTrustWatchNotification({
          rule: reputationRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} reputation score worsened.`,
          reason: `The reputation score dropped from ${previousBusiness.reputationScore} to ${currentBusiness.reputationScore}.`,
          timestamp,
        }),
      );
    }

    const graphRule = findRule(input.watchlist.rules, "graph_changed");
    if (graphRule && hasChanged(previousBusiness.graphSignature, currentBusiness.graphSignature)) {
      notifications.push(
        createTrustWatchNotification({
          rule: graphRule,
          business: currentBusiness,
          summary: `${currentBusiness.name} has a changed business graph signature.`,
          reason: "The entity relationship graph signature changed.",
          timestamp,
        }),
      );
    }
  }

  return notifications;
}

export { createTrustWatchNotification, sampleTrustWatchNotification } from "./notifications";
export { advanceSchedule, createTrustWatchSchedule, runScheduledEvaluation } from "./scheduler";
export { defaultTrustWatchRules, findRule, hasChanged, isSslExpired } from "./rules";
export { addBusinessToWatchlist, createWatchlist, removeBusinessFromWatchlist, sampleTrustWatchWatchlist } from "./watchlist";
export type {
  TrustWatchBusiness,
  TrustWatchEvaluationInput,
  TrustWatchNotification,
  TrustWatchNotificationPriority,
  TrustWatchRule,
  TrustWatchRuleType,
  TrustWatchSchedule,
  TrustWatchWatchlist,
} from "./types";

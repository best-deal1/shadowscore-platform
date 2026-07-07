export type TrustWatchRuleType =
  | "identity_changed"
  | "dns_changed"
  | "ssl_expired"
  | "email_changed"
  | "new_contradiction"
  | "reputation_worsened"
  | "graph_changed";

export type TrustWatchNotificationPriority = "info" | "warning" | "critical";

export type TrustWatchBusiness = {
  id: string;
  name: string;
  domain?: string;
  email?: string;
  identity?: Record<string, unknown>;
  dns?: Record<string, unknown>;
  ssl?: {
    expiresAt?: string;
    [key: string]: unknown;
  };
  reputationScore?: number;
  contradictions?: string[];
  graphSignature?: string;
  metadata?: Record<string, unknown>;
};

export type TrustWatchRule = {
  id: string;
  type: TrustWatchRuleType;
  label: string;
  priority: TrustWatchNotificationPriority;
  enabled: boolean;
  recommendedAction: string;
};

export type TrustWatchNotification = {
  id: string;
  priority: TrustWatchNotificationPriority;
  title: string;
  summary: string;
  affectedBusiness: TrustWatchBusiness;
  reason: string;
  timestamp: string;
  recommendedAction: string;
  ruleType: TrustWatchRuleType;
};

export type TrustWatchWatchlist = {
  id: string;
  userId: string;
  name: string;
  businesses: TrustWatchBusiness[];
  rules: TrustWatchRule[];
  createdAt: string;
  updatedAt: string;
};

export type TrustWatchEvaluationInput = {
  watchlist: TrustWatchWatchlist;
  previousBusinesses: TrustWatchBusiness[];
  currentBusinesses: TrustWatchBusiness[];
  evaluatedAt?: string;
};

export type TrustWatchSchedule = {
  id: string;
  watchlistId: string;
  cadence: "hourly" | "daily" | "weekly";
  nextRunAt: string;
  enabled: boolean;
};

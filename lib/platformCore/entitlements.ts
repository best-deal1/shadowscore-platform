export type FeatureKey = string;
export type Entitlement = { featureKey: FeatureKey; enabled: boolean; limit: number | null; unit: string | null };

export function evaluateFeature(entitlements: readonly Entitlement[], request: { featureKey: FeatureKey; currentUsage?: number; requestedQuantity?: number }) {
  const entitlement = entitlements.find((item) => item.featureKey === request.featureKey);
  if (!entitlement?.enabled) return { allowed: false, reason: "missing_entitlement" as const };
  if (entitlement.limit !== null && (request.currentUsage ?? 0) + (request.requestedQuantity ?? 1) > entitlement.limit) return { allowed: false, reason: "limit_reached" as const };
  return { allowed: true, reason: "granted" as const };
}

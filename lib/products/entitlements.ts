import { getProduct } from "./catalog.ts";
import type { Feature, ProductId, ProductLimits } from "./types.ts";

export type EntitlementGrant = {
  productId: ProductId;
  scope: "report" | "workspace";
  scopeId: string;
  status: "active" | "expired" | "revoked";
  startsAt: string;
  endsAt?: string;
};

export type EntitlementContext = {
  grants: readonly EntitlementGrant[];
  now?: Date;
};

export type EntitlementDecision = { allowed: boolean; reason: "granted" | "missing_entitlement" | "limit_reached" };

function activeGrants(context: EntitlementContext, scope: EntitlementGrant["scope"], scopeId: string) {
  const now = (context.now ?? new Date()).getTime();
  return context.grants.filter((grant) =>
    grant.scope === scope && grant.scopeId === scopeId && grant.status === "active" &&
    Date.parse(grant.startsAt) <= now && (!grant.endsAt || Date.parse(grant.endsAt) > now));
}

export function checkEntitlement(
  context: EntitlementContext,
  request: { feature: Feature; scope: EntitlementGrant["scope"]; scopeId: string; currentUsage?: number; limit?: keyof ProductLimits },
): EntitlementDecision {
  const products = activeGrants(context, request.scope, request.scopeId).map((grant) => getProduct(grant.productId));
  const featureProducts = products.filter((product) => product.features.has(request.feature));
  if (featureProducts.length === 0) return { allowed: false, reason: "missing_entitlement" };

  if (request.limit && request.currentUsage !== undefined) {
    const effectiveLimit = Math.max(...featureProducts.map((product) => product.limits[request.limit!]));
    if (request.currentUsage >= effectiveLimit) return { allowed: false, reason: "limit_reached" };
  }
  return { allowed: true, reason: "granted" };
}

export function requireEntitlement(context: EntitlementContext, request: Parameters<typeof checkEntitlement>[1]) {
  const decision = checkEntitlement(context, request);
  if (!decision.allowed) throw new Error(`Feature access denied: ${decision.reason}`);
}

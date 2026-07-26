export const COST_SOURCES = ["internal_execution", "external_provider", "ai_model", "storage", "monitoring_recurring", "manual_review"] as const;
export const BILLING_UNITS = ["investigation", "collector", "provider", "observation", "assertion", "monitoring_cycle", "api_request"] as const;

export type CostSource = typeof COST_SOURCES[number];
export type BillingUnit = typeof BILLING_UNITS[number];
export type Money = { amount: number; currency: string };
export type PricingRule = {
  ruleId: string;
  costSource: CostSource;
  billingUnit: BillingUnit;
  unitPrice: Money;
  provider?: string;
  collector?: string;
  minimumQuantity?: number;
};
export type PricingPolicy = {
  policyId: string;
  version: number;
  currency: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  rules: readonly PricingRule[];
};
export type CostRecord = {
  executionId: string;
  investigationId: string;
  workspaceId: string;
  provider: string | null;
  collector: string;
  costSource: CostSource;
  billingUnit: BillingUnit;
  quantity: number;
  estimatedCost: Money;
  actualCost: Money | null;
  billableCost: Money;
  internalPlatformCost: Money;
  pricingPolicyId: string;
  pricingPolicyVersion: number;
};

export function selectPricingPolicy(policies: readonly PricingPolicy[], at: Date): PricingPolicy | null {
  const timestamp = at.getTime();
  return policies
    .filter((policy) => Date.parse(policy.effectiveFrom) <= timestamp && (!policy.effectiveUntil || Date.parse(policy.effectiveUntil) > timestamp))
    .sort((a, b) => b.version - a.version)[0] ?? null;
}

export function priceUsage(policy: PricingPolicy, input: { costSource: CostSource; billingUnit: BillingUnit; quantity: number; provider?: string; collector?: string }): Money | null {
  if (!Number.isFinite(input.quantity) || input.quantity < 0) throw new Error("Quantity must be a non-negative number.");
  const matches = policy.rules.filter((rule) => rule.costSource === input.costSource && rule.billingUnit === input.billingUnit &&
    (!rule.provider || rule.provider === input.provider) && (!rule.collector || rule.collector === input.collector));
  const rule = matches.sort((a, b) => Number(Boolean(b.provider)) + Number(Boolean(b.collector)) - Number(Boolean(a.provider)) - Number(Boolean(a.collector)))[0];
  if (!rule) return null;
  const quantity = Math.max(input.quantity, rule.minimumQuantity ?? 0);
  return { amount: quantity * rule.unitPrice.amount, currency: rule.unitPrice.currency };
}

export function validateCostRecord(record: CostRecord): void {
  const amounts = [record.estimatedCost, record.billableCost, record.internalPlatformCost, ...(record.actualCost ? [record.actualCost] : [])];
  if (amounts.some((money) => money.currency !== record.estimatedCost.currency)) throw new Error("A cost record must use one currency.");
  if (amounts.some((money) => !Number.isFinite(money.amount) || money.amount < 0)) throw new Error("Cost amounts must be non-negative numbers.");
  if (!record.executionId || !record.investigationId || !record.workspaceId || !record.collector) throw new Error("Collector cost attribution is incomplete.");
}

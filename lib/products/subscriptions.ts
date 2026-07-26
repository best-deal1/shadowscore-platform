import type { ProductId } from "./types.ts";

export type WorkspaceSubscription = {
  id: string;
  workspaceId: string;
  productId: Exclude<ProductId, "instant_report">;
  status: "pending" | "active" | "past_due" | "cancelled";
  billingProvider?: string;
  providerReference?: string;
  currentPeriodStartsAt?: string;
  currentPeriodEndsAt?: string;
};

/** Provider-neutral boundary for a future recurring billing integration. */
export interface WorkspaceSubscriptionRepository {
  findActive(workspaceId: string): Promise<WorkspaceSubscription | null>;
  save(subscription: WorkspaceSubscription): Promise<void>;
}

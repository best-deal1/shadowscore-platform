import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { EntitlementGrant } from "./entitlements.ts";

export type GuestReportPurchase = {
  id: string;
  email: string;
  reportId: string;
  claimTokenHash: string;
  downloadTokenHash: string;
  expiresAt: string;
  claimedByUserId?: string;
  claimedAt?: string;
};

export type GuestReportReceipt = { reportId: string; downloadToken: string; claimToken: string; claimExpiresAt: string };

export interface GuestReportRepository {
  save(purchase: GuestReportPurchase): Promise<void>;
  findByClaimTokenHash(hash: string): Promise<GuestReportPurchase | null>;
  update(purchase: GuestReportPurchase): Promise<void>;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const token = () => randomBytes(32).toString("base64url");

export async function issueGuestReport(repository: GuestReportRepository, input: { email: string; reportId: string; now?: Date }): Promise<GuestReportReceipt> {
  const now = input.now ?? new Date();
  const claimToken = token();
  const downloadToken = token();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await repository.save({ id: randomUUID(), email: input.email.trim().toLowerCase(), reportId: input.reportId, claimTokenHash: hashToken(claimToken), downloadTokenHash: hashToken(downloadToken), expiresAt });
  return { reportId: input.reportId, downloadToken, claimToken, claimExpiresAt: expiresAt };
}

export async function claimGuestReport(repository: GuestReportRepository, input: { claimToken: string; userId: string; now?: Date }): Promise<{ reportId: string; grant: EntitlementGrant }> {
  const purchase = await repository.findByClaimTokenHash(hashToken(input.claimToken));
  const now = input.now ?? new Date();
  if (!purchase || Date.parse(purchase.expiresAt) <= now.getTime()) throw new Error("The claim token is invalid or expired.");
  if (purchase.claimedByUserId && purchase.claimedByUserId !== input.userId) throw new Error("This report has already been claimed.");
  const claimed = { ...purchase, claimedByUserId: input.userId, claimedAt: now.toISOString() };
  await repository.update(claimed);
  return {
    reportId: purchase.reportId,
    grant: { productId: "instant_report", scope: "report", scopeId: purchase.reportId, status: "active", startsAt: claimed.claimedAt },
  };
}

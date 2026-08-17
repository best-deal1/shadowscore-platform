import type { EvidenceItem } from "./types";

/** Excludes observations that cannot materially answer the investigation's target question. */
export function isApplicableEvidence(item: EvidenceItem, targetType: string) {
  const providerId = item.provider.toLowerCase();
  const title = item.title.toLowerCase();
  const isWebsite = ["website", "business"].includes(targetType.toLowerCase());
  if (isWebsite && ["marketplace", "payment", "compliance"].includes(providerId)) return false;
  if (isWebsite && /(marketplace|seller-to-company|payout|payment processor|compliance authority|regulatory relationship)/i.test(title)) return false;
  if ((item.category === "Missing" || item.category === "Unavailable" || item.category === "Not Checked") && /\b(aaaa|cname) records?\b/i.test(item.title)) return false;
  if ((item.category === "Missing" || item.category === "Unavailable") && /http header/i.test(item.title)) return false;
  return item.category !== "Not Applicable";
}

export function applicableEvidence(items: EvidenceItem[], targetType: string) {
  return items.filter((item) => isApplicableEvidence(item, targetType));
}

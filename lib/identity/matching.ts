import type { EvidenceItem, EvidenceRef } from "../evidence/types";
import type { IdentitySignal, IdentitySignalType } from "./types";

const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "tiktok.com", "youtube.com"];
const MARKETPLACE_HOSTS = ["amazon.", "ebay.", "etsy.", "walmart.", "shopify.com", "mercari."];
const PAYMENT_HOSTS = ["paypal.", "stripe.", "squareup.com", "venmo.com", "cash.app"];

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\b(inc|llc|ltd|limited|corp|corporation|co|company)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeDomain(value: string): string {
  const clean = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return clean.split("/")[0].split(":")[0];
}

export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
export function normalizePhone(value: string): string { return value.replace(/\D/g, ""); }
export function normalizeAccount(value: string): string { return value.trim().toLowerCase().replace(/\/$/, ""); }

export function normalizeSignal(type: IdentitySignalType, value: string): string {
  if (type === "business_name" || type === "organization_schema") return normalizeName(value);
  if (type === "domain" || type === "website") return normalizeDomain(value);
  if (type === "email") return normalizeEmail(value);
  if (type === "phone") return normalizePhone(value);
  return normalizeAccount(value);
}

function inferType(ref: EvidenceRef): IdentitySignalType | undefined {
  const text = `${ref.type} ${ref.label} ${ref.value || ""}`.toLowerCase();
  const value = ref.value || ref.label;
  const domain = /https?:\/\//.test(value) || /\b[a-z0-9.-]+\.[a-z]{2,}\b/i.test(value) ? normalizeDomain(value) : "";
  if (text.includes("schema") || text.includes("organization")) return "organization_schema";
  if (text.includes("email") || /\S+@\S+\.\S+/.test(value)) return "email";
  if (text.includes("phone") || text.includes("telephone") || normalizePhone(value).length >= 10) return "phone";
  if (domain && SOCIAL_HOSTS.some((host) => domain.includes(host))) return "social_profile";
  if (domain && MARKETPLACE_HOSTS.some((host) => domain.includes(host))) return "marketplace_account";
  if (domain && PAYMENT_HOSTS.some((host) => domain.includes(host))) return "payment_account";
  if (text.includes("social")) return "social_profile";
  if (text.includes("marketplace") || text.includes("seller") || text.includes("storefront")) return "marketplace_account";
  if (text.includes("payment") || text.includes("merchant")) return "payment_account";
  if (text.includes("website")) return "website";
  if (text.includes("domain") || domain) return "domain";
  if (text.includes("business") || text.includes("name") || text.includes("brand")) return "business_name";
  return undefined;
}

export function extractIdentitySignals(items: EvidenceItem[]): IdentitySignal[] {
  const signals: IdentitySignal[] = [];
  for (const item of items) {
    for (const ref of item.evidenceRefs) {
      const type = inferType(ref);
      const raw = ref.value || ref.label;
      if (!type || !raw) continue;
      const normalizedValue = normalizeSignal(type, raw);
      if (!normalizedValue) continue;
      signals.push({ type, value: raw, normalizedValue, evidenceRef: ref.id, evidenceItemId: item.id, source: item.source });
    }
  }
  return signals;
}

export function shouldLink(a: IdentitySignal, b: IdentitySignal): boolean {
  if (a.normalizedValue === b.normalizedValue) return true;
  const strong = new Set<IdentitySignalType>(["domain", "website", "email", "phone", "social_profile", "marketplace_account", "payment_account"]);
  if (strong.has(a.type) && strong.has(b.type) && a.normalizedValue === b.normalizedValue) return true;
  if ((a.type === "business_name" || a.type === "organization_schema") && (b.type === "business_name" || b.type === "organization_schema")) return a.normalizedValue === b.normalizedValue;
  return false;
}

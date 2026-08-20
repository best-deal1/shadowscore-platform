const EXACT_PUBLIC_MAILBOX_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "ymail.com", "rocketmail.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com",
  "aol.com", "gmx.com", "gmx.net", "mail.com",
  "zoho.com", "fastmail.com",
  "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it", "hotmail.es",
  "live.co.uk", "live.fr", "live.de", "live.it",
  "yahoo.co.uk", "yahoo.co.il", "yahoo.ca", "yahoo.com.au", "yahoo.de", "yahoo.fr", "yahoo.it", "yahoo.es", "yahoo.co.jp"
]);

export const PUBLIC_MAILBOX_DOMAINS = EXACT_PUBLIC_MAILBOX_DOMAINS;

export function isPublicMailboxDomain(domain: string) {
  const normalized = domain.trim().toLowerCase().replace(/^www\./, "");
  if (EXACT_PUBLIC_MAILBOX_DOMAINS.has(normalized)) return true;
  if (/^(?:hotmail|live|outlook|yahoo)\.[a-z]{2,3}(?:\.[a-z]{2})?$/.test(normalized)) return true;
  return false;
}

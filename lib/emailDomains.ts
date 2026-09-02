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

export type EmailInvestigationRouting = {
  submittedSeed: string;
  emailClassification: "FREE_MAIL" | "CORPORATE_DOMAIN";
  primaryInvestigationEntity: string;
  primaryInvestigationType: "PERSON_IDENTITY" | "DOMAIN_BUSINESS_LEGAL_ENTITY";
  routingReason: string;
  domainInvestigated: string;
  localPartIdentityExpansionPermitted: boolean;
  localPartIdentityExpansionReason: string;
};

/** The single routing decision shared by planning, providers, and reports. */
export function classifyEmailInvestigation(email: string): EmailInvestigationRouting | undefined {
  const match = /^([^\s@]+)@([^\s@]+)$/i.exec(email.trim());
  if (!match) return undefined;
  const submittedSeed = `${match[1]}@${match[2].toLowerCase()}`;
  const domain = match[2].toLowerCase().replace(/^www\./, "");
  const freeMail = isPublicMailboxDomain(domain);
  return {
    submittedSeed,
    emailClassification: freeMail ? "FREE_MAIL" : "CORPORATE_DOMAIN",
    primaryInvestigationEntity: freeMail ? submittedSeed : domain,
    primaryInvestigationType: freeMail ? "PERSON_IDENTITY" : "DOMAIN_BUSINESS_LEGAL_ENTITY",
    routingReason: freeMail
      ? "The address uses a public mailbox provider, so identity investigation is scoped to the submitted address and does not attribute provider infrastructure to the subject."
      : "The address uses a custom domain, so the domain and associated business or legal entity are investigated before any mailbox identity.",
    domainInvestigated: domain,
    localPartIdentityExpansionPermitted: freeMail,
    localPartIdentityExpansionReason: freeMail
      ? "The local-part may be used only as a discovery identifier. It is not treated as a person name or independent identity evidence."
      : "Mailbox identity expansion is withheld until independent evidence connects the mailbox to a person at the domain or associated organization.",
  };
}

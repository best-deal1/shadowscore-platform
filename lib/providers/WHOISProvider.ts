import { BaseProvider } from "./BaseProvider";
import type { ProviderExecutionContext, ProviderEvidence, ProviderFinding, ProviderHealth, ProviderResult } from "./types";

type RdapEvent = {
  eventAction?: string;
  eventDate?: string;
};

type RdapResponse = {
  objectClassName?: string;
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: RdapEvent[];
  nameservers?: Array<{ ldhName?: string }>;
};

const RDAP_BASE_URL = "https://rdap.org/domain/";

function normalizeDomain(target: string) {
  const value = target.trim();

  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "").toLowerCase();
  }
}

function findEventDate(events: RdapEvent[] = [], action: string) {
  return events.find((event) => event.eventAction?.toLowerCase() === action)?.eventDate;
}

function domainAgeDays(registrationDate?: string) {
  if (!registrationDate) return undefined;

  const registeredAt = new Date(registrationDate).getTime();
  if (Number.isNaN(registeredAt)) return undefined;

  return Math.max(0, Math.floor((Date.now() - registeredAt) / 86_400_000));
}

export class WHOISProvider extends BaseProvider {
  readonly id = "whois";
  readonly name = "WHOIS Provider";
  readonly version = "1.0.0";
  readonly category = "whois" as const;

  async health(): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      providerVersion: this.version,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      metadata: {
        category: this.category,
        providerName: this.name,
        integration: "rdap",
        endpoint: RDAP_BASE_URL,
      },
    };
  }

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const domain = normalizeDomain(context.target);

    if (!domain) {
      throw new Error("WHOIS lookup requires a domain target.");
    }

    const response = await fetch(`${RDAP_BASE_URL}${encodeURIComponent(domain)}`, {
      headers: { accept: "application/rdap+json, application/json" },
    });

    if (!response.ok) {
      throw new Error(`RDAP lookup failed for ${domain}: ${response.status}`);
    }

    const payload = (await response.json()) as RdapResponse;
    const registrationDate = findEventDate(payload.events, "registration");
    const expirationDate = findEventDate(payload.events, "expiration");
    const ageDays = domainAgeDays(registrationDate);
    const statuses = payload.status || [];
    const nameservers = (payload.nameservers || []).map((nameserver) => nameserver.ldhName).filter(Boolean) as string[];

    const findings: ProviderFinding[] = [];

    if (ageDays !== undefined && ageDays < 90) {
      findings.push({
        id: "whois-new-domain",
        title: "Domain registration is recent",
        description: `The domain appears to be ${ageDays} day${ageDays === 1 ? "" : "s"} old based on RDAP registration data.`,
        severity: ageDays < 30 ? "medium" : "low",
      });
    }

    if (!registrationDate) {
      findings.push({
        id: "whois-registration-date-missing",
        title: "Domain registration date unavailable",
        description: "The RDAP response did not include a registration event date, reducing ownership-age validation confidence.",
        severity: "low",
      });
    }

    const evidence: ProviderEvidence[] = [
      {
        id: "whois-domain",
        type: "observation",
        label: "Normalized domain",
        value: domain,
        source: RDAP_BASE_URL,
      },
      {
        id: "whois-registration-date",
        type: "observation",
        label: "Registration date",
        value: registrationDate || "unavailable",
        source: RDAP_BASE_URL,
      },
      {
        id: "whois-expiration-date",
        type: "observation",
        label: "Expiration date",
        value: expirationDate || "unavailable",
        source: RDAP_BASE_URL,
      },
      {
        id: "whois-statuses",
        type: "observation",
        label: "Domain statuses",
        value: statuses.join(", ") || "unavailable",
        source: RDAP_BASE_URL,
      },
    ];

    return {
      findings,
      evidence,
      metadata: {
        integrationStatus: "connected",
        lookupPerformed: true,
        lookupProtocol: "rdap",
        domain,
        registrationDate,
        expirationDate,
        ageDays,
        statuses,
        nameservers,
        rdapHandle: payload.handle,
        scanMode: context.scanMode,
        platform: context.platform,
        intakeId: context.intakeId,
      },
    };
  }
}

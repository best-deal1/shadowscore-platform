import { promises as dns } from "node:dns";

import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderHealth, ProviderResult } from "./types";

type DnsRecordType = "A" | "AAAA" | "MX" | "NS" | "TXT" | "CNAME";

type DnsRecords = Record<DnsRecordType, string[]>;

const DNS_RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"];
const DNS_SOURCE = "node:dns";

function normalizeDomain(target: string) {
  const value = target.trim();

  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "").toLowerCase();
  }
}

function formatDnsError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return error instanceof Error ? error.message : "Unknown DNS lookup error";
}

async function resolveRecord(domain: string, recordType: DnsRecordType): Promise<string[]> {
  switch (recordType) {
    case "A":
      return dns.resolve4(domain);
    case "AAAA":
      return dns.resolve6(domain);
    case "MX": {
      const records = await dns.resolveMx(domain);
      return records.map((record) => `${record.priority} ${record.exchange}`);
    }
    case "NS":
      return dns.resolveNs(domain);
    case "TXT": {
      const records = await dns.resolveTxt(domain);
      return records.map((record) => record.join(""));
    }
    case "CNAME":
      return dns.resolveCname(domain);
  }
}

export class DNSProvider extends BaseProvider {
  readonly id = "dns";
  readonly name = "DNS Provider";
  readonly version = "1.0.0";
  readonly category = "dns" as const;

  async health(): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      providerVersion: this.version,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      metadata: {
        category: this.category,
        providerName: this.name,
        integration: DNS_SOURCE,
        recordTypes: DNS_RECORD_TYPES,
      },
    };
  }

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const domain = normalizeDomain(context.target);

    if (!domain) {
      throw new Error("DNS lookup requires a domain target.");
    }

    const records = {} as DnsRecords;
    const lookupErrors: Partial<Record<DnsRecordType, string>> = {};

    await Promise.all(
      DNS_RECORD_TYPES.map(async (recordType) => {
        try {
          records[recordType] = await resolveRecord(domain, recordType);
        } catch (error) {
          records[recordType] = [];
          lookupErrors[recordType] = formatDnsError(error);
        }
      }),
    );

    const evidence: ProviderEvidence[] = [
      {
        id: "dns-domain",
        type: "observation",
        label: "Normalized domain",
        value: domain,
        source: DNS_SOURCE,
      },
      ...DNS_RECORD_TYPES.map((recordType) => ({
        id: `dns-${recordType.toLowerCase()}-records`,
        type: "observation" as const,
        label: `${recordType} records`,
        value: records[recordType].join(", ") || "unavailable",
        source: DNS_SOURCE,
      })),
    ];

    return {
      findings: [],
      evidence,
      metadata: {
        integrationStatus: "connected",
        lookupPerformed: true,
        lookupProtocol: "dns",
        domain,
        recordTypes: DNS_RECORD_TYPES,
        records,
        lookupErrors,
        scanMode: context.scanMode,
        platform: context.platform,
        intakeId: context.intakeId,
      },
    };
  }
}

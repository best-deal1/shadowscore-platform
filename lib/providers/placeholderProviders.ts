import { BaseProvider } from "./BaseProvider";
import type { ProviderCategory, ProviderExecutionContext, ProviderEvidence, ProviderFinding, ProviderResult } from "./types";

type PlaceholderProviderConfig = {
  id: string;
  name: string;
  version: string;
  category: ProviderCategory;
  evidenceLabel: string;
  findingTitle: string;
};

class PlaceholderProvider extends BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: ProviderCategory;
  private readonly evidenceLabel: string;
  private readonly findingTitle: string;

  constructor(config: PlaceholderProviderConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.category = config.category;
    this.evidenceLabel = config.evidenceLabel;
    this.findingTitle = config.findingTitle;
  }

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const findings: ProviderFinding[] = [
      this.placeholderFinding(
        this.findingTitle,
        `${this.name} is registered in the Provider Framework and is ready for a future production integration.`,
      ),
    ];

    const evidence: ProviderEvidence[] = [
      {
        id: `${this.id}-target`,
        type: "placeholder",
        label: this.evidenceLabel,
        value: context.target,
        source: "provider-framework-placeholder",
      },
    ];

    return {
      findings,
      evidence,
      metadata: {
        integrationStatus: "not_connected",
        lookupPerformed: false,
        scanMode: context.scanMode,
        platform: context.platform,
        intakeId: context.intakeId,
      },
    };
  }
}

export class SSLProvider extends PlaceholderProvider { constructor() { super({ id: "ssl", name: "SSL Provider", version: "1.0.0", category: "ssl", evidenceLabel: "Target prepared for SSL inspection", findingTitle: "SSL provider placeholder registered" }); } }
export class DNSProvider extends PlaceholderProvider { constructor() { super({ id: "dns", name: "DNS Provider", version: "1.0.0", category: "dns", evidenceLabel: "Target prepared for DNS inspection", findingTitle: "DNS provider placeholder registered" }); } }
export class WHOISProvider extends PlaceholderProvider { constructor() { super({ id: "whois", name: "WHOIS Provider", version: "1.0.0", category: "whois", evidenceLabel: "Target prepared for WHOIS inspection", findingTitle: "WHOIS provider placeholder registered" }); } }
export class SecurityHeadersProvider extends PlaceholderProvider { constructor() { super({ id: "security-headers", name: "Security Headers Provider", version: "1.0.0", category: "security_headers", evidenceLabel: "Target prepared for security headers inspection", findingTitle: "Security headers provider placeholder registered" }); } }
export class SPFProvider extends PlaceholderProvider { constructor() { super({ id: "spf", name: "SPF Provider", version: "1.0.0", category: "email_authentication", evidenceLabel: "Target prepared for SPF inspection", findingTitle: "SPF provider placeholder registered" }); } }
export class DMARCProvider extends PlaceholderProvider { constructor() { super({ id: "dmarc", name: "DMARC Provider", version: "1.0.0", category: "email_authentication", evidenceLabel: "Target prepared for DMARC inspection", findingTitle: "DMARC provider placeholder registered" }); } }
export class ReputationProvider extends PlaceholderProvider { constructor() { super({ id: "reputation", name: "Reputation Provider", version: "1.0.0", category: "reputation", evidenceLabel: "Target prepared for reputation inspection", findingTitle: "Reputation provider placeholder registered" }); } }
export class BusinessProfileProvider extends PlaceholderProvider { constructor() { super({ id: "business-profile", name: "Business Profile Provider", version: "1.0.0", category: "business_profile", evidenceLabel: "Target prepared for business profile inspection", findingTitle: "Business profile provider placeholder registered" }); } }
export class MarketplaceProvider extends PlaceholderProvider { constructor() { super({ id: "marketplace", name: "Marketplace Provider", version: "1.0.0", category: "marketplace", evidenceLabel: "Target prepared for marketplace inspection", findingTitle: "Marketplace provider placeholder registered" }); } }
export class PaymentProvider extends PlaceholderProvider { constructor() { super({ id: "payment", name: "Payment Provider", version: "1.0.0", category: "payment", evidenceLabel: "Target prepared for payment inspection", findingTitle: "Payment provider placeholder registered" }); } }
export class ComplianceProvider extends PlaceholderProvider { constructor() { super({ id: "compliance", name: "Compliance Provider", version: "1.0.0", category: "compliance", evidenceLabel: "Target prepared for compliance inspection", findingTitle: "Compliance provider placeholder registered" }); } }

export function createDefaultProviders() {
  return [
    new SSLProvider(),
    new DNSProvider(),
    new WHOISProvider(),
    new SecurityHeadersProvider(),
    new SPFProvider(),
    new DMARCProvider(),
    new ReputationProvider(),
    new BusinessProfileProvider(),
    new MarketplaceProvider(),
    new PaymentProvider(),
    new ComplianceProvider(),
  ];
}

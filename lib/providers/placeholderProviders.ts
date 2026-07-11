import { BaseProvider } from "./BaseProvider";
import type { ProviderCategory, ProviderExecutionContext, ProviderEvidence, ProviderFinding, ProviderResult } from "./types";

type PlaceholderProviderConfig = { id: string; name: string; version: string; category: ProviderCategory; evidenceLabel: string; findingTitle: string };
class PlaceholderProvider extends BaseProvider {
  readonly id: string; readonly name: string; readonly version: string; readonly category: ProviderCategory; private readonly evidenceLabel: string; private readonly findingTitle: string;
  constructor(config: PlaceholderProviderConfig) { super(); this.id = config.id; this.name = config.name; this.version = config.version; this.category = config.category; this.evidenceLabel = config.evidenceLabel; this.findingTitle = config.findingTitle; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const findings: ProviderFinding[] = [this.placeholderFinding(this.findingTitle, `${this.name} remains a future private-data integration and was not checked.`)]; const evidence: ProviderEvidence[] = [{ id: `${this.id}-target`, type: "placeholder", label: this.evidenceLabel, value: context.target, source: "provider-framework-placeholder" }]; return { findings, evidence, metadata: { integrationStatus: "not_connected", lookupPerformed: false, failureReason: "Not Supported", scanMode: context.scanMode, platform: context.platform, intakeId: context.intakeId } }; }
}
export class MarketplaceProvider extends PlaceholderProvider { constructor() { super({ id: "marketplace", name: "Marketplace Provider", version: "1.0.0", category: "marketplace", evidenceLabel: "Marketplace private evidence not checked", findingTitle: "Marketplace provider not supported without private API access" }); } }
export class PaymentProvider extends PlaceholderProvider { constructor() { super({ id: "payment", name: "Payment Provider", version: "1.0.0", category: "payment", evidenceLabel: "Payment private evidence not checked", findingTitle: "Payment provider not supported without processor API access" }); } }
export class ComplianceProvider extends PlaceholderProvider { constructor() { super({ id: "compliance", name: "Compliance Provider", version: "1.0.0", category: "compliance", evidenceLabel: "Compliance private evidence not checked", findingTitle: "Compliance provider not supported without authority API access" }); } }
export function createPlaceholderProviders() { return [new MarketplaceProvider(), new PaymentProvider(), new ComplianceProvider()]; }

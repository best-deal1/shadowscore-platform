import { analyzeRisk } from "./riskEngine";
import type { PaymentIntent, ShadowScoreIntake, ShadowScoreReport } from "./workspace";

export const REPORT_ENGINE_VERSION = "report-pipeline-v22";

type ProviderResult = {
  providerId: string;
  version: string;
  status: "placeholder_ready";
  categories: string[];
  evidence: string[];
};

const placeholderProviders = [
  { id: "target-capture", version: "placeholder-v1", categories: ["target", "identity"] },
  { id: "evidence-readiness", version: "placeholder-v1", categories: ["evidence", "documentation"] },
  { id: "payment-unlock", version: "placeholder-v1", categories: ["payment", "entitlement"] },
];

export function canGenerateReport(paymentIntent: PaymentIntent) {
  return paymentIntent.paymentStatus === "paid";
}

function executePlaceholderProviders(intake: ShadowScoreIntake, paymentIntent: PaymentIntent): ProviderResult[] {
  return placeholderProviders.map((provider) => ({
    providerId: provider.id,
    version: provider.version,
    status: "placeholder_ready",
    categories: provider.categories,
    evidence: [
      `intake:${intake.intakeId}`,
      `paymentIntent:${paymentIntent.id}`,
      `scanMode:${intake.scanMode}`,
    ],
  }));
}

export function buildReadyReport(input: {
  intake: ShadowScoreIntake;
  paymentIntent: PaymentIntent;
  reportId?: string;
  createdAt?: string;
}): ShadowScoreReport {
  const { intake, paymentIntent } = input;

  if (!canGenerateReport(paymentIntent)) {
    throw new Error("Report generation requires paymentStatus == paid.");
  }

  const providerResults = executePlaceholderProviders(intake, paymentIntent);
  const engineInput = {
    marketplace: intake.platform,
    caseType: intake.caseType,
    store: intake.target,
    email: intake.email,
    fileNames: intake.fileNames,
    evidencePresent: intake.visibleSignalCategories.length,
    evidenceRequired: intake.scanMode === "website" ? 0 : 4,
  };
  const riskEnginePreview = analyzeRisk(engineInput);
  const now = new Date().toISOString();

  return {
    reportId: input.reportId || `rpt-${Date.now().toString(36)}`,
    intakeId: intake.intakeId,
    paymentIntentId: paymentIntent.id,
    userId: intake.userId,
    title: `${intake.scanMode === "website" ? "Website" : "Trust"} Intelligence Report`,
    entity: intake.target,
    platform: intake.platform,
    scanMode: intake.scanMode,
    target: intake.target,
    createdAt: input.createdAt || paymentIntent.createdAt,
    readyAt: now,
    paymentStatus: paymentIntent.paymentStatus,
    reportStatus: "ready",
    source: "payment_unlock_pipeline",
    engineVersion: REPORT_ENGINE_VERSION,
    providerVersions: Object.fromEntries(providerResults.map((result) => [result.providerId, result.version])),
    providerResults,
    evidenceSummary: {
      fileCount: intake.fileNames.length,
      categories: intake.visibleSignalCategories,
      missingEvidence: riskEnginePreview.missingEvidence,
    },
    reportSummary: {
      message: "Report generated from paid intake and placeholder provider outputs. Detailed intelligence will expand as production providers are connected.",
      primaryRiskDomain: riskEnginePreview.primaryRiskDomain,
      findingCount: riskEnginePreview.findings.length,
    },
    riskScore: undefined,
    confidenceScore: undefined,
    stage: riskEnginePreview.stage,
    topFactors: [],
  };
}

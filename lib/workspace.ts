/* eslint-disable @typescript-eslint/no-explicit-any */
import { LEGAL_ACCEPTANCE_VERSION } from "./legal";
import type { DecisionOutput } from "./decisionEngine";
import type { CorrelationSummary } from "./correlation";
import type { TrustInsight } from "./insightEngine";
import type { IdentityProfile } from "./identityEngine";
import type { BusinessNarrative } from "./narrative/types";
import type { BusinessIdentityIntelligenceResult } from "./businessIdentityIntelligence";
import type { BusinessIntelligenceResult } from "./businessIntelligence";
import type { CanonicalWebsiteReport, WebsiteIntelligenceReport } from "./websiteIntelligence";
import type { WebsiteChangeReport } from "./websiteIntelligence/history";
import type { ShadowScorecard } from "./scoring";
import type { InvestigationStage } from "./investigation/timeline";
import type { ReasoningOutput } from "./reasoning";
import type { KnowledgeGraphSnapshot } from "./knowledgeGraph/types";
import type { ProviderExecutionRecord } from "./providers/ProviderManager";
import type { ProviderResult } from "./providers/types";
import type { InvestigationIntelligence } from "./investigationIntelligence";
import { supabaseFetch, isSupabaseConfigured, requirePersistentSessionInProduction } from "./supabase";
import { cloneWorkspace, getMutableMemoryWorkspace } from "./workspaceStore";
import { QUICK_INVESTIGATION } from "./pricing";

export type WorkspaceSession = {
  userId: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  startedAt: string;
};

export type PaymentStatus = "payment_pending" | "processing" | "paid" | "admin_comped" | "failed" | "refunded";
export type ReportStatus = "preview" | "payment_pending" | "generating" | "ready" | "failed";
export type ScanMode = "website" | "marketplace" | "evidence";

export type ShadowScoreIntake = {
  intakeId: string;
  userId: string;
  scanMode: ScanMode;
  target: string;
  platform: string;
  caseType?: string;
  email: string;
  fileNames: string[];
  visibleSignalCategories: string[];
  paymentStatus: PaymentStatus;
  reportStatus: ReportStatus;
  createdAt: string;
};

export type ShadowScoreReport = {
  reportId: string;
  intakeId?: string;
  paymentIntentId?: string;
  acceptanceId?: string;
  userId?: string;
  title: string;
  entity: string;
  platform: string;
  scanMode?: ScanMode;
  target?: string;
  riskScore?: number;
  confidenceScore?: number;
  stage: "Healthy" | "Warning" | "Restricted" | "Suspended" | "Critical";
  createdAt: string;
  readyAt?: string;
  paymentStatus?: PaymentStatus;
  accessType?: "customer_payment" | "administrator";
  administratorNotice?: string;
  reportStatus: ReportStatus;
  source: string;
  engineVersion?: string;
  providerVersions?: Record<string, string>;
  providerResults?: ProviderResult[];
  evidenceSummary?: unknown;
  reportSummary?: { message: string; primaryRiskDomain?: string; findingCount?: number; insights?: TrustInsight[]; insightEngineVersion?: string; decision?: DecisionOutput; reasoning?: ReasoningOutput; correlationSummary?: CorrelationSummary; identityProfile?: IdentityProfile; businessNarrative?: BusinessNarrative; businessIdentityResolution?: unknown; businessIdentityIntelligence?: BusinessIdentityIntelligenceResult; businessIntelligence?: BusinessIntelligenceResult; investigationIntelligence?: InvestigationIntelligence; websiteIntelligence?: WebsiteIntelligenceReport; canonicalWebsiteReport?: CanonicalWebsiteReport; websiteChangeReport?: WebsiteChangeReport; websiteAlertSummary?: { count: number; severities: Record<string, number> }; websiteChangeTimeline?: Array<{ scanId: string; scannedAt: string; summary: string; changeCount: number; alertIds: string[] }>; scorecard?: ShadowScorecard; investigationTimeline?: InvestigationStage[]; execution?: { completedInSeconds: number; providersExecuted: number; evidenceCollected: number; decisionConfidence?: string }; executionFlow?: string[]; knowledgeGraph?: KnowledgeGraphSnapshot; technicalDetails?: { executed: ProviderExecutionRecord[]; skipped: ProviderExecutionRecord[]; pending: ProviderExecutionRecord[]; failed: ProviderExecutionRecord[] }; sourceProvenance?: Array<{ label: string; completedAt?: string }> };
  topFactors: string[];
};

export type ShadowScoreEntity = {
  id: string;
  name: string;
  type: "Marketplace" | "Payment" | "Business" | "Website" | "Supplier";
  status: "Monitoring" | "Needs Evidence" | "Stable" | "High Risk";
  lastScore: number;
  updatedAt: string;
};

export type ShadowScoreAcceptance = {
  reportId: string;
  planName: string;
  price: string;
  method: string;
  acceptedAt: string;
  legalVersion: string;
  source: string;
};

export type PaymentIntent = {
  id: string;
  intakeId?: string;
  planName: string;
  price: string;
  method: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export const REPORT_PRODUCT = {
  name: QUICK_INVESTIGATION.name,
  price: QUICK_INVESTIGATION.price,
  amount: QUICK_INVESTIGATION.amount,
  estimatedGenerationTime: "Usually ready within 2 minutes",
  includes: ["Executive recommendation", "Verified findings and evidence gaps", "Source trail", "Prioritized action plan"],
} as const;

export function reportIdForPayment(paymentIntentId: string) {
  return `locked-${paymentIntentId}`;
}

export type WorkspaceData = {
  reports: ShadowScoreReport[];
  intakes: ShadowScoreIntake[];
  entities: ShadowScoreEntity[];
  acceptances: ShadowScoreAcceptance[];
  paymentIntents: PaymentIntent[];
};

/**
 * Internal implementation data remains with the stored report. Browser-facing
 * workspace views receive the business brief data and source provenance only.
 */
export function presentReportForEndUser(report: ShadowScoreReport): ShadowScoreReport {
  if (!report.reportSummary) return { ...report, providerResults: undefined };
  const reportSummary = { ...report.reportSummary };
  delete reportSummary.reasoning;
  delete reportSummary.correlationSummary;
  delete reportSummary.businessIdentityResolution;
  delete reportSummary.businessIdentityIntelligence;
  delete reportSummary.execution;
  delete reportSummary.executionFlow;
  delete reportSummary.knowledgeGraph;
  delete reportSummary.technicalDetails;
  return { ...report, providerResults: undefined, reportSummary };
}

export function presentWorkspaceForEndUser(workspace: WorkspaceData): WorkspaceData {
  return { ...workspace, reports: workspace.reports.map(presentReportForEndUser) };
}

function requireWorkspace(userId: string) {
  return getMutableMemoryWorkspace(userId);
}

function centsFromPrice(price: string) {
  const match = price.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Math.round(Number(match[0]) * 100) : 0;
}

function mapPaymentIntentRow(row: Record<string, any>): PaymentIntent {
  return {
    id: row.id,
    intakeId: row.metadata?.intakeId,
    planName: row.plan_name,
    price: row.metadata?.price || `${row.currency} ${(row.amount_cents / 100).toFixed(2)}`,
    method: row.method,
    paymentStatus: (row.status === "succeeded" ? "paid" : row.status === "requires_payment" ? "payment_pending" : row.status) as PaymentStatus,
    createdAt: row.created_at,
  };
}

export async function getWorkspace(session: WorkspaceSession): Promise<WorkspaceData> {
  if (isSupabaseConfigured() && session.accessToken) {
    const [reportRows, intakeRows, entityRows, acceptanceRows, intentRows] = await Promise.all([
      supabaseFetch<Record<string, any>[]>(`/rest/v1/reports?select=*&order=created_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/intakes?select=*&order=created_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/watchlist_entries?select=*&order=updated_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/legal_acceptances?select=*&order=accepted_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/payment_intents?select=*&order=created_at.desc`, {}, session.accessToken),
    ]);
    return presentWorkspaceForEndUser({
      reports: reportRows.map((row) => ({ reportId: row.report_id, intakeId: row.intake_id, paymentIntentId: row.payment_intent_id, acceptanceId: row.acceptance_id, title: row.title, entity: row.entity, platform: row.platform, scanMode: row.scan_mode, target: row.target, riskScore: row.risk_score || undefined, confidenceScore: row.confidence_score || undefined, stage: row.stage || "Healthy", createdAt: row.created_at, readyAt: row.ready_at, paymentStatus: row.payment_status || (row.metadata?.paymentStatus as PaymentStatus), accessType: row.access_type || row.metadata?.accessType, administratorNotice: row.metadata?.administratorNotice, reportStatus: row.report_status || "ready", source: row.source, engineVersion: row.risk_engine_version, providerVersions: row.provider_versions || {}, providerResults: row.provider_results || [], evidenceSummary: row.evidence_snapshot || {}, reportSummary: row.metadata?.reportSummary, topFactors: row.top_factors || [] })),
      intakes: intakeRows.map((row) => ({ intakeId: row.intake_id, userId: row.user_id, scanMode: row.scan_mode, target: row.target, platform: row.platform, caseType: row.case_type, email: row.email, fileNames: row.file_names || [], visibleSignalCategories: row.visible_signal_categories || [], paymentStatus: row.payment_status, reportStatus: row.report_status, createdAt: row.created_at })),
      entities: entityRows.map((row) => ({ id: row.id, name: row.name, type: row.type, status: row.status, lastScore: row.last_score, updatedAt: row.updated_at })),
      acceptances: acceptanceRows.map((row) => ({ reportId: row.report_id || row.payment_intent_id || row.id, planName: row.metadata?.planName || "Checkout", price: row.metadata?.price || "", method: row.metadata?.method || "", acceptedAt: row.accepted_at, legalVersion: row.legal_version, source: row.source })),
      paymentIntents: intentRows.map(mapPaymentIntentRow),
    });
  }

  requirePersistentSessionInProduction(session.accessToken);
  return presentWorkspaceForEndUser(cloneWorkspace(requireWorkspace(session.userId)));
}

export async function addWatchlistEntity(session: WorkspaceSession, entity: ShadowScoreEntity): Promise<ShadowScoreEntity> {
  if (isSupabaseConfigured() && session.accessToken) {
    const [created] = await supabaseFetch<Record<string, any>[]>("/rest/v1/watchlist_entries?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ user_id: session.userId, name: entity.name, type: entity.type, status: entity.status, last_score: entity.lastScore, updated_at: entity.updatedAt }),
    }, session.accessToken);
    return { id: created.id, name: created.name, type: created.type, status: created.status, lastScore: created.last_score, updatedAt: created.updated_at };
  }

  requirePersistentSessionInProduction(session.accessToken);
  const workspace = requireWorkspace(session.userId);
  workspace.entities = [entity, ...workspace.entities].slice(0, 25);
  return entity;
}

export async function createIntake(session: WorkspaceSession, record: Omit<ShadowScoreIntake, "intakeId" | "userId" | "paymentStatus" | "reportStatus" | "createdAt">) {
  const intake: ShadowScoreIntake = { intakeId: `intake-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, userId: session.userId, ...record, paymentStatus: "payment_pending", reportStatus: "preview", createdAt: new Date().toISOString() };
  if (isSupabaseConfigured() && session.accessToken) {
    const [created] = await supabaseFetch<Record<string, any>[]>("/rest/v1/intakes?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        intake_id: intake.intakeId,
        user_id: session.userId,
        scan_mode: intake.scanMode,
        target: intake.target,
        platform: intake.platform,
        case_type: intake.caseType,
        email: intake.email,
        file_names: intake.fileNames,
        visible_signal_categories: intake.visibleSignalCategories,
        payment_status: intake.paymentStatus,
        report_status: intake.reportStatus,
        created_at: intake.createdAt,
      }),
    }, session.accessToken);
    return {
      intakeId: created.intake_id,
      userId: created.user_id,
      scanMode: created.scan_mode,
      target: created.target,
      platform: created.platform,
      caseType: created.case_type,
      email: created.email,
      fileNames: created.file_names || [],
      visibleSignalCategories: created.visible_signal_categories || [],
      paymentStatus: created.payment_status,
      reportStatus: created.report_status,
      createdAt: created.created_at,
    };
  }
  requirePersistentSessionInProduction(session.accessToken);
  const workspace = requireWorkspace(session.userId);
  workspace.intakes = [intake, ...workspace.intakes].slice(0, 25);
  return intake;
}

export async function createCheckoutIntent(session: WorkspaceSession, record: { planName: string; price: string; method: string; intakeId?: string }) {
  if (isSupabaseConfigured() && session.accessToken && record.intakeId) {
    const activeRows = await supabaseFetch<Record<string, any>[]>(`/rest/v1/payment_intents?select=*&metadata->>intakeId=eq.${encodeURIComponent(record.intakeId)}&status=in.(payment_pending,processing,paid,requires_payment,succeeded)&limit=1`, {}, session.accessToken);
    const now = new Date().toISOString();
    let createdIntent = activeRows[0];
    if (!createdIntent) {
      [createdIntent] = await supabaseFetch<Record<string, any>[]>("/rest/v1/payment_intents?select=*", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: session.userId, plan_name: record.planName, amount_cents: centsFromPrice(record.price), currency: "USD", method: record.method, status: "requires_payment", metadata: { price: record.price, intakeId: record.intakeId } }),
      }, session.accessToken);
    }
    if (!createdIntent?.id) throw new Error("Checkout did not create a payment intent.");

    const [intakeRows, acceptanceRows, reportRows] = await Promise.all([
      supabaseFetch<Record<string, any>[]>(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(record.intakeId)}&select=*`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/legal_acceptances?payment_intent_id=eq.${encodeURIComponent(createdIntent.id)}&select=id&limit=1`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/reports?report_id=eq.${encodeURIComponent(reportIdForPayment(createdIntent.id))}&select=report_id&limit=1`, {}, session.accessToken),
    ]);
    const intake = intakeRows[0];
    if (!intake) throw new Error("The saved investigation could not be found for checkout.");

    if (!acceptanceRows[0]) {
      await supabaseFetch("/rest/v1/legal_acceptances", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: session.userId, payment_intent_id: createdIntent.id, legal_version: LEGAL_ACCEPTANCE_VERSION, terms_version: LEGAL_ACCEPTANCE_VERSION, privacy_version: LEGAL_ACCEPTANCE_VERSION, source: "checkout", metadata: record }),
      }, session.accessToken);
    }
    if (!reportRows[0]) {
      await supabaseFetch("/rest/v1/reports", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: session.userId, report_id: reportIdForPayment(createdIntent.id), intake_id: intake.intake_id,
          payment_intent_id: createdIntent.id, title: "Locked Trust Intelligence Report", entity: intake.target,
          platform: intake.platform, risk_score: 0, confidence_score: 0, stage: "Healthy",
          source: "checkout_locked_placeholder", top_factors: [], risk_engine_version: "locked", provider_versions: {},
          evidence_snapshot: {}, report_version: "locked", score_explanation: "Report locked until payment is completed.",
          scan_mode: intake.scan_mode, target: intake.target, payment_status: "payment_pending", report_status: "payment_pending",
          provider_results: [], metadata: { paymentStatus: "payment_pending", reportStatus: "payment_pending" }, created_at: now,
        }),
      }, session.accessToken);
    }
    await supabaseFetch(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(record.intakeId)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ report_status: "payment_pending" }),
    }, session.accessToken);
    const verifiedReports = await supabaseFetch<Record<string, any>[]>(`/rest/v1/reports?report_id=eq.${encodeURIComponent(reportIdForPayment(createdIntent.id))}&select=report_id&limit=1`, {}, session.accessToken);
    if (!verifiedReports[0]) throw new Error("Checkout did not create the locked report.");
    return mapPaymentIntentRow(createdIntent);
  }
  requirePersistentSessionInProduction(session.accessToken);
  const existingWorkspace = requireWorkspace(session.userId);
  const existingIntent = existingWorkspace.paymentIntents.find((item) => item.intakeId === record.intakeId && ["payment_pending", "processing", "paid"].includes(item.paymentStatus));
  if (existingIntent) return existingIntent;

  const now = new Date().toISOString();
  const id = `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const intent: PaymentIntent = { id, ...record, paymentStatus: "payment_pending", createdAt: now };
  const acceptance: ShadowScoreAcceptance = {
    reportId: id,
    ...record,
    acceptedAt: now,
    legalVersion: LEGAL_ACCEPTANCE_VERSION,
    source: "checkout",
  };

  if (isSupabaseConfigured() && session.accessToken) {
    const [createdIntent] = await supabaseFetch<Record<string, any>[]>("/rest/v1/payment_intents?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ user_id: session.userId, plan_name: record.planName, amount_cents: centsFromPrice(record.price), currency: "USD", method: record.method, status: "requires_payment", metadata: { price: record.price, intakeId: record.intakeId } }),
    }, session.accessToken);
    await supabaseFetch("/rest/v1/legal_acceptances", { method: "POST", body: JSON.stringify({ user_id: session.userId, payment_intent_id: createdIntent.id, legal_version: LEGAL_ACCEPTANCE_VERSION, terms_version: LEGAL_ACCEPTANCE_VERSION, privacy_version: LEGAL_ACCEPTANCE_VERSION, source: "checkout", metadata: record }) }, session.accessToken);
    if (record.intakeId) {
      const [updatedIntake] = await supabaseFetch<Record<string, any>[]>(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(record.intakeId)}&select=*`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ report_status: "payment_pending" }),
      }, session.accessToken);
      if (updatedIntake) {
        await supabaseFetch("/rest/v1/reports", {
          method: "POST",
          body: JSON.stringify({
            user_id: session.userId,
            report_id: reportIdForPayment(createdIntent.id),
            intake_id: updatedIntake.intake_id,
            payment_intent_id: createdIntent.id,
            title: "Locked Trust Intelligence Report",
            entity: updatedIntake.target,
            platform: updatedIntake.platform,
            risk_score: 0,
            confidence_score: 0,
            stage: "Healthy",
            source: "checkout_locked_placeholder",
            top_factors: [],
            risk_engine_version: "locked",
            provider_versions: {},
            evidence_snapshot: {},
            report_version: "locked",
            score_explanation: "Report locked until payment is completed.",
            scan_mode: updatedIntake.scan_mode,
            target: updatedIntake.target,
            payment_status: "payment_pending",
            report_status: "payment_pending",
            provider_results: [],
            metadata: { paymentStatus: "payment_pending", reportStatus: "payment_pending" },
          }),
        }, session.accessToken);
      }
    }
    return mapPaymentIntentRow(createdIntent);
  }

  const workspace = requireWorkspace(session.userId);
  workspace.paymentIntents = [intent, ...workspace.paymentIntents].slice(0, 25);
  workspace.acceptances = [acceptance, ...workspace.acceptances].slice(0, 25);
  if (record.intakeId) {
    const intake = workspace.intakes.find((item) => item.intakeId === record.intakeId);
    workspace.intakes = workspace.intakes.map((item) => item.intakeId === record.intakeId ? { ...item, reportStatus: "payment_pending" } : item);
    if (intake) {
      workspace.reports = [{
        reportId: reportIdForPayment(intent.id),
        intakeId: intake.intakeId,
        paymentIntentId: intent.id,
        userId: session.userId,
        title: "Locked Trust Intelligence Report",
        entity: intake.target,
        platform: intake.platform,
        scanMode: intake.scanMode,
        target: intake.target,
        createdAt: now,
        paymentStatus: "payment_pending" as const,
        reportStatus: "payment_pending" as const,
        source: "checkout_locked_placeholder",
        stage: "Healthy" as const,
        topFactors: [],
      }, ...workspace.reports].slice(0, 25);
    }
  }
  return intent;
}

export function workspaceModeLabel() {
  return isSupabaseConfigured() ? "Supabase database" : "development in-memory workspace";
}

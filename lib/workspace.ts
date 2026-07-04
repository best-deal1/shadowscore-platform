import { LEGAL_ACCEPTANCE_VERSION } from "./legal";
import { buildReadyReport, canGenerateReport } from "./reportPipeline";
import { supabaseFetch, isSupabaseConfigured } from "./supabase";

export type WorkspaceSession = {
  userId: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  startedAt: string;
};

export type PaymentStatus = "payment_pending" | "processing" | "paid" | "failed" | "refunded";
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
  reportStatus: ReportStatus;
  source: string;
  engineVersion?: string;
  providerVersions?: Record<string, string>;
  providerResults?: unknown[];
  evidenceSummary?: unknown;
  reportSummary?: { message: string; primaryRiskDomain?: string; findingCount?: number };
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

export type WorkspaceData = {
  reports: ShadowScoreReport[];
  intakes: ShadowScoreIntake[];
  entities: ShadowScoreEntity[];
  acceptances: ShadowScoreAcceptance[];
  paymentIntents: PaymentIntent[];
};

const emptyWorkspace: WorkspaceData = { reports: [], intakes: [], entities: [], acceptances: [], paymentIntents: [] };
const memoryWorkspaces = new Map<string, WorkspaceData>();

function cloneWorkspace(data: WorkspaceData): WorkspaceData {
  return JSON.parse(JSON.stringify(data)) as WorkspaceData;
}

function requireWorkspace(userId: string) {
  const existing = memoryWorkspaces.get(userId) || emptyWorkspace;
  const copy = cloneWorkspace(existing);
  memoryWorkspaces.set(userId, copy);
  return copy;
}

function centsFromPrice(price: string) {
  const match = price.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Math.round(Number(match[0]) * 100) : 0;
}

export async function getWorkspace(session: WorkspaceSession): Promise<WorkspaceData> {
  if (isSupabaseConfigured() && session.accessToken) {
    const [reportRows, entityRows, acceptanceRows, intentRows] = await Promise.all([
      supabaseFetch<Record<string, any>[]>(`/rest/v1/reports?select=*&order=created_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/watchlist_entries?select=*&order=updated_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/legal_acceptances?select=*&order=accepted_at.desc`, {}, session.accessToken),
      supabaseFetch<Record<string, any>[]>(`/rest/v1/payment_intents?select=*&order=created_at.desc`, {}, session.accessToken),
    ]);
    return {
      reports: reportRows.map((row) => ({ reportId: row.report_id, acceptanceId: row.acceptance_id, title: row.title, entity: row.entity, platform: row.platform, riskScore: row.risk_score || undefined, confidenceScore: row.confidence_score || undefined, stage: row.stage || "Healthy", createdAt: row.created_at, readyAt: row.ready_at, paymentStatus: row.payment_status || (row.metadata?.paymentStatus as PaymentStatus), reportStatus: row.report_status || "ready", source: row.source, engineVersion: row.risk_engine_version, providerVersions: row.provider_versions || {}, providerResults: row.provider_results || [], evidenceSummary: row.evidence_snapshot || {}, reportSummary: row.metadata?.reportSummary, topFactors: row.top_factors || [] })),
      intakes: [],
      entities: entityRows.map((row) => ({ id: row.id, name: row.name, type: row.type, status: row.status, lastScore: row.last_score, updatedAt: row.updated_at })),
      acceptances: acceptanceRows.map((row) => ({ reportId: row.report_id || row.payment_intent_id || row.id, planName: row.metadata?.planName || "Checkout", price: row.metadata?.price || "", method: row.metadata?.method || "", acceptedAt: row.accepted_at, legalVersion: row.legal_version, source: row.source })),
      paymentIntents: intentRows.map((row) => ({ id: row.id, intakeId: row.metadata?.intakeId, planName: row.plan_name, price: `${row.currency} ${(row.amount_cents / 100).toFixed(2)}`, method: row.method, paymentStatus: (row.status === "succeeded" ? "paid" : row.status === "requires_payment" ? "payment_pending" : row.status) as PaymentStatus, createdAt: row.created_at })),
    };
  }

  return cloneWorkspace(requireWorkspace(session.userId));
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

  const workspace = requireWorkspace(session.userId);
  workspace.entities = [entity, ...workspace.entities].slice(0, 25);
  return entity;
}

export async function createIntake(session: WorkspaceSession, record: Omit<ShadowScoreIntake, "intakeId" | "userId" | "paymentStatus" | "reportStatus" | "createdAt">) {
  const intake: ShadowScoreIntake = { intakeId: `intake-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, userId: session.userId, ...record, paymentStatus: "payment_pending", reportStatus: "preview", createdAt: new Date().toISOString() };
  const workspace = requireWorkspace(session.userId);
  workspace.intakes = [intake, ...workspace.intakes].slice(0, 25);
  return intake;
}

export async function createCheckoutIntent(session: WorkspaceSession, record: { planName: string; price: string; method: string; intakeId?: string }) {
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
    return intent;
  }

  const workspace = requireWorkspace(session.userId);
  workspace.paymentIntents = [intent, ...workspace.paymentIntents].slice(0, 25);
  workspace.acceptances = [acceptance, ...workspace.acceptances].slice(0, 25);
  if (record.intakeId) {
    const intake = workspace.intakes.find((item) => item.intakeId === record.intakeId);
    workspace.intakes = workspace.intakes.map((item) => item.intakeId === record.intakeId ? { ...item, reportStatus: "payment_pending" } : item);
    if (intake) {
      workspace.reports = [{
        reportId: `locked-${intent.id}`,
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

export async function markPaymentPaidAndGenerateReport(session: WorkspaceSession, paymentIntentId: string) {
  const workspace = requireWorkspace(session.userId);
  const intent = workspace.paymentIntents.find((item) => item.id === paymentIntentId);
  if (!intent) throw new Error("Payment intent not found.");
  intent.paymentStatus = "paid";
  const intake = workspace.intakes.find((item) => item.intakeId === intent.intakeId);
  if (!intake) throw new Error("Intake not found for payment intent.");
  intake.paymentStatus = "paid";
  intake.reportStatus = "generating";
  if (!canGenerateReport(intent)) throw new Error("Payment is not paid.");
  const report = buildReadyReport({ intake, paymentIntent: intent });
  workspace.reports = [report, ...workspace.reports.filter((item) => item.paymentIntentId !== intent.id)].slice(0, 25);
  intake.reportStatus = "ready";
  return report;
}

export function workspaceModeLabel() {
  return isSupabaseConfigured() ? "Supabase database" : "development in-memory workspace";
}

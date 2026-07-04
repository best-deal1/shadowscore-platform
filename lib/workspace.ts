import { LEGAL_ACCEPTANCE_VERSION } from "./legal";
import { supabaseFetch, isSupabaseConfigured } from "./supabase";

export type WorkspaceSession = {
  userId: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  startedAt: string;
};

export type ShadowScoreReport = {
  reportId: string;
  acceptanceId?: string;
  title: string;
  entity: string;
  platform: string;
  riskScore: number;
  confidenceScore: number;
  stage: "Healthy" | "Warning" | "Restricted" | "Suspended" | "Critical";
  createdAt: string;
  source: string;
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
  planName: string;
  price: string;
  method: string;
  status: "created" | "requires_payment" | "succeeded" | "cancelled";
  createdAt: string;
};

export type WorkspaceData = {
  reports: ShadowScoreReport[];
  entities: ShadowScoreEntity[];
  acceptances: ShadowScoreAcceptance[];
  paymentIntents: PaymentIntent[];
};

const emptyWorkspace: WorkspaceData = { reports: [], entities: [], acceptances: [], paymentIntents: [] };
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
      reports: reportRows.map((row) => ({ reportId: row.report_id, acceptanceId: row.acceptance_id, title: row.title, entity: row.entity, platform: row.platform, riskScore: row.risk_score, confidenceScore: row.confidence_score, stage: row.stage, createdAt: row.created_at, source: row.source, topFactors: row.top_factors || [] })),
      entities: entityRows.map((row) => ({ id: row.id, name: row.name, type: row.type, status: row.status, lastScore: row.last_score, updatedAt: row.updated_at })),
      acceptances: acceptanceRows.map((row) => ({ reportId: row.report_id || row.payment_intent_id || row.id, planName: row.metadata?.planName || "Checkout", price: row.metadata?.price || "", method: row.metadata?.method || "", acceptedAt: row.accepted_at, legalVersion: row.legal_version, source: row.source })),
      paymentIntents: intentRows.map((row) => ({ id: row.id, planName: row.plan_name, price: `${row.currency} ${(row.amount_cents / 100).toFixed(2)}`, method: row.method, status: row.status, createdAt: row.created_at })),
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

export async function createCheckoutIntent(session: WorkspaceSession, record: { planName: string; price: string; method: string }) {
  const now = new Date().toISOString();
  const id = `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const intent: PaymentIntent = { id, ...record, status: "requires_payment", createdAt: now };
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
      body: JSON.stringify({ user_id: session.userId, plan_name: record.planName, amount_cents: centsFromPrice(record.price), currency: "USD", method: record.method, status: "requires_payment", metadata: { price: record.price } }),
    }, session.accessToken);
    await supabaseFetch("/rest/v1/legal_acceptances", { method: "POST", body: JSON.stringify({ user_id: session.userId, payment_intent_id: createdIntent.id, legal_version: LEGAL_ACCEPTANCE_VERSION, terms_version: LEGAL_ACCEPTANCE_VERSION, privacy_version: LEGAL_ACCEPTANCE_VERSION, source: "checkout", metadata: record }) }, session.accessToken);
    return intent;
  }

  const workspace = requireWorkspace(session.userId);
  workspace.paymentIntents = [intent, ...workspace.paymentIntents].slice(0, 25);
  workspace.acceptances = [acceptance, ...workspace.acceptances].slice(0, 25);
  return intent;
}

export function workspaceModeLabel() {
  return isSupabaseConfigured() ? "Supabase database" : "development in-memory workspace";
}

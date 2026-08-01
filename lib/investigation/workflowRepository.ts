import { EMPTY_TECHNICAL_STATUS } from "./status";
import type { Investigation, InvestigationSeed, InvestigationStatus } from "./types";

export type InvestigationRepositoryRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

export type InvestigationOwner = Readonly<{
  userId: string;
  organizationId: string | null;
  email: string;
}>;

type InvestigationRow = {
  investigation_id: string;
  owner_user_id: string;
  organization_id: string | null;
  target: string;
  platform: string;
  scan_mode: string;
  case_type?: string | null;
  payment_status: string;
  report_status: string;
  created_at: string;
  updated_at: string;
};

type ReportRow = { investigation_id: string; report_id: string; report_status: string };
type IntakeInsertRow = Omit<InvestigationRow, "investigation_id" | "owner_user_id"> & { intake_id: string; user_id: string };

export interface InvestigationRepository {
  list(): Promise<Investigation[]>;
  get(investigationId: string): Promise<Investigation | null>;
  create(seed: InvestigationSeed): Promise<Investigation>;
}

function statusFor(row: InvestigationRow): InvestigationStatus {
  if (row.report_status === "ready" || row.report_status === "generating" || row.report_status === "failed") return row.report_status;
  if (row.report_status === "payment_pending" || row.payment_status === "payment_pending") return "payment_pending";
  return "preview";
}

function mapRow(row: InvestigationRow, reportId?: string): Investigation {
  return {
    investigationId: row.investigation_id,
    intakeId: row.investigation_id,
    userId: row.owner_user_id,
    target: row.target,
    normalizedTarget: row.target.trim().toLowerCase(),
    targetType: row.scan_mode === "website" ? "Website" : row.scan_mode === "marketplace" ? "Marketplace Seller" : "Business",
    status: statusFor(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reportId,
    ontologyGraph: { entities: [], relationships: [] },
    evidenceRefs: [],
    decision: null,
    technicalStatus: EMPTY_TECHNICAL_STATUS,
    outcome: "unresolved",
  };
}

/** Supabase adapter for the canonical Investigation projections. The caller's JWT keeps RLS active. */
export class SupabaseInvestigationRepository implements InvestigationRepository {
  private readonly request: InvestigationRepositoryRequest;
  private readonly accessToken: string;
  private readonly owner: InvestigationOwner;

  constructor(
    request: InvestigationRepositoryRequest,
    accessToken: string,
    owner: InvestigationOwner,
  ) {
    this.request = request;
    this.accessToken = accessToken;
    this.owner = owner;
  }

  async list() {
    const [rows, reports] = await Promise.all([
      this.request<InvestigationRow[]>("/rest/v1/investigation_list_projection?select=*&order=updated_at.desc", {}, this.accessToken),
      this.request<ReportRow[]>("/rest/v1/investigation_report_projection?select=investigation_id,report_id,report_status&order=created_at.desc", {}, this.accessToken),
    ]);
    const reportByInvestigation = new Map(reports.map((report) => [report.investigation_id, report.report_id]));
    return rows.map((row) => mapRow(row, reportByInvestigation.get(row.investigation_id)));
  }

  async get(investigationId: string) {
    const encodedId = encodeURIComponent(investigationId);
    const [rows, reports] = await Promise.all([
      this.request<InvestigationRow[]>(`/rest/v1/investigation_detail_projection?investigation_id=eq.${encodedId}&select=*&limit=1`, {}, this.accessToken),
      this.request<ReportRow[]>(`/rest/v1/investigation_report_projection?investigation_id=eq.${encodedId}&select=investigation_id,report_id,report_status&order=created_at.desc&limit=1`, {}, this.accessToken),
    ]);
    return rows[0] ? mapRow(rows[0], reports[0]?.report_id) : null;
  }

  async create(seed: InvestigationSeed) {
    const target = seed.target.trim();
    if (!target) throw new Error("An investigation target is required.");
    const investigationId = seed.intakeId ?? `intake-${crypto.randomUUID()}`;
    const scanMode = seed.targetType === "Marketplace Seller" ? "marketplace" : seed.targetType === "Business" ? "evidence" : "website";
    const [created] = await this.request<IntakeInsertRow[]>("/rest/v1/intakes?select=intake_id,user_id,organization_id,target,platform,scan_mode,case_type,payment_status,report_status,created_at,updated_at", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        intake_id: investigationId,
        user_id: this.owner.userId,
        organization_id: this.owner.organizationId,
        scan_mode: scanMode,
        target,
        platform: scanMode === "marketplace" ? "marketplace" : "web",
        email: this.owner.email,
        file_names: [],
        visible_signal_categories: [],
        payment_status: "payment_pending",
        report_status: "preview",
      }),
    }, this.accessToken);
    if (!created) throw new Error("The investigation could not be created.");
    return mapRow({ ...created, investigation_id: created.intake_id, owner_user_id: created.user_id });
  }
}

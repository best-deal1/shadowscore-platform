import { supabaseFetch } from "../supabase";
import type { WebsiteScanHistoryRepository, WebsiteScanSnapshot } from "./history";

type ScanRow = { scan_id: string; target: string; scanned_at: string; scan_snapshot: WebsiteScanSnapshot["report"]; change_report: WebsiteScanSnapshot["changeReport"] };
function fromRow(row: ScanRow): WebsiteScanSnapshot { return { scanId: row.scan_id, target: row.target, scannedAt: row.scanned_at, report: row.scan_snapshot, changeReport: row.change_report }; }

/** Supabase adapter for the append-only website_intelligence_scans table. */
export class SupabaseWebsiteScanHistoryRepository implements WebsiteScanHistoryRepository {
  constructor(private readonly userId: string, private readonly accessToken: string, private readonly linkage?: { subjectId: string; investigationJobId?: string }) {}
  async latest(target: string) {
    const rows = await supabaseFetch<ScanRow[]>(`/rest/v1/website_intelligence_scans?target=eq.${encodeURIComponent(target)}&select=*&order=scanned_at.desc&limit=1`, {}, this.accessToken);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }
  async list(target: string) {
    const rows = await supabaseFetch<ScanRow[]>(`/rest/v1/website_intelligence_scans?target=eq.${encodeURIComponent(target)}&select=*&order=scanned_at.asc`, {}, this.accessToken);
    return rows.map(fromRow);
  }
  async append(snapshot: WebsiteScanSnapshot) {
    await supabaseFetch("/rest/v1/website_intelligence_scans", { method: "POST", body: JSON.stringify({ scan_id: snapshot.scanId, user_id: this.userId, target: snapshot.target, scanned_at: snapshot.scannedAt, previous_scan_id: snapshot.changeReport.previousScanId, scan_snapshot: snapshot.report, change_report: snapshot.changeReport, subject_id: this.linkage?.subjectId, investigation_job_id: this.linkage?.investigationJobId }) }, this.accessToken);
  }
}

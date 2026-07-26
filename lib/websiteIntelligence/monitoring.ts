import { investigateWebsite } from "./index";
import { createWebsiteChangeReport, websiteScanHistoryRepository, type WebsiteScanHistoryRepository, type WebsiteScanSnapshot } from "./history";
import type { WebsiteScanContext } from "./types";
import { createWebsiteAlerts, type WebsiteAlertRepository } from "./alerts";
import type { WebsiteWatchlistRepository } from "./watchlist";

const severityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 } as const;
export async function investigateAndRecordWebsite(input: WebsiteScanContext, repository: WebsiteScanHistoryRepository = websiteScanHistoryRepository, alerting?: { tenantId: string; repository: WebsiteAlertRepository; watchlistRepository?: WebsiteWatchlistRepository }) {
  const report = await investigateWebsite(input);
  const previous = await repository.latest(report.target);
  const id = `wscan-${report.scannedAt.replace(/[^0-9]/g, "")}-${crypto.randomUUID()}`;
  const snapshot: WebsiteScanSnapshot = { scanId: id, target: report.target, scannedAt: report.scannedAt, report: structuredClone(report), changeReport: createWebsiteChangeReport(previous, report, id) };
  await repository.append(snapshot);
  const alerts = alerting ? createWebsiteAlerts(alerting.tenantId, report.target, snapshot.changeReport) : [];
  if (alerts.length && alerting) await alerting.repository.appendMany(alerts);
  if (alerting?.watchlistRepository) {
    const highest = alerts.reduce<(typeof alerts)[number]["severity"] | "None">((value, alert) => value === "None" || severityRank[alert.severity] > severityRank[value] ? alert.severity : value, "None");
    await alerting.watchlistRepository.updateScanMetadata(alerting.tenantId, report.target, { lastScannedAt: report.scannedAt, latestChangeCount: snapshot.changeReport.changes.length, latestRiskLevel: highest, nextScanAt: null });
  }
  return { report, snapshot, alerts, history: await repository.list(report.target) };
}

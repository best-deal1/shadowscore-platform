import { investigateWebsite } from "./index";
import { createWebsiteChangeReport, websiteScanHistoryRepository, type WebsiteScanHistoryRepository, type WebsiteScanSnapshot } from "./history";
import type { WebsiteScanContext } from "./types";
import { createWebsiteAlerts, type WebsiteAlertRepository } from "./alerts";

export async function investigateAndRecordWebsite(input: WebsiteScanContext, repository: WebsiteScanHistoryRepository = websiteScanHistoryRepository, alerting?: { tenantId: string; repository: WebsiteAlertRepository }) {
  const report = await investigateWebsite(input);
  const previous = await repository.latest(report.target);
  const id = `wscan-${report.scannedAt.replace(/[^0-9]/g, "")}-${crypto.randomUUID()}`;
  const snapshot: WebsiteScanSnapshot = { scanId: id, target: report.target, scannedAt: report.scannedAt, report: structuredClone(report), changeReport: createWebsiteChangeReport(previous, report, id) };
  await repository.append(snapshot);
  const alerts = alerting ? createWebsiteAlerts(alerting.tenantId, report.target, snapshot.changeReport) : [];
  if (alerts.length && alerting) await alerting.repository.appendMany(alerts);
  return { report, snapshot, alerts, history: await repository.list(report.target) };
}

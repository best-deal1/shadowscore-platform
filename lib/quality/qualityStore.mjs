import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

export const QUALITY_DIR = "quality";
export const HISTORY_DIR = join(QUALITY_DIR, "history");
export const LATEST_PATH = join(QUALITY_DIR, "latest.json");
export const DASHBOARD_JSON_PATH = join(QUALITY_DIR, "dashboard.json");
export const DASHBOARD_MD_PATH = join(QUALITY_DIR, "dashboard.md");
export const RELEASE_BASELINE_PATH = join(QUALITY_DIR, "last-merged-release.json");

export function ensureQualityDirs() { mkdirSync(HISTORY_DIR, { recursive: true }); }
export function pct(n, d) { return d > 0 ? Math.round((n / d) * 1000) / 10 : null; }
export function avg(values) { const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return nums.length ? Math.round((nums.reduce((a,b)=>a+b,0)/nums.length)*1000)/1000 : null; }
export function readJson(path, fallback = null) { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; } }
export function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }
export function historyFiles() { ensureQualityDirs(); return readdirSync(HISTORY_DIR).filter((f)=>f.endsWith(".json")).sort().map((f)=>join(HISTORY_DIR,f)); }
export function readHistory() { return historyFiles().map((f)=>readJson(f)).filter(Boolean).sort((a,b)=>String(a.run.startedAt).localeCompare(String(b.run.startedAt))); }
export function writeRun(run) { ensureQualityDirs(); const stamp = run.run.startedAt.replace(/[:.]/g, "-"); const path = join(HISTORY_DIR, `${stamp}-${run.run.environment}.json`); writeJson(path, run); writeJson(LATEST_PATH, run); if (!existsSync(RELEASE_BASELINE_PATH) && run.summary.regressionCount === 0) writeJson(RELEASE_BASELINE_PATH, run); return path; }
export function successfulRuns(history) { return history.filter((r)=>r.summary?.productionPipelineFailed === false); }
export function previousSuccessful(history, latestId) { const ok = successfulRuns(history).filter((r)=>r.run.id !== latestId); return ok.at(-1) || null; }
export function trend(history, days, latest) { const latestTime = new Date(latest.run.startedAt).getTime(); const windowMs = days * 24 * 60 * 60 * 1000; const rows = successfulRuns(history).filter((r)=>latestTime - new Date(r.run.startedAt).getTime() <= windowMs); return { days, runCount: rows.length, passRate: avg(rows.map((r)=>r.summary.passRate)), evidenceCoverage: avg(rows.map((r)=>r.summary.averageEvidenceCoverage)), httpSuccessRate: avg(rows.map((r)=>r.summary.httpAcquisitionSuccessRate)), providerCompletionRate: avg(rows.map((r)=>r.summary.providerCompletionRate)) };
}

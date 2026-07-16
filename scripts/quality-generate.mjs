import { collectLiveQuality } from "../lib/quality/liveQuality.mjs";
import { compareQuality } from "../lib/quality/compareQuality.mjs";
import { readHistory, writeRun, writeJson, DASHBOARD_JSON_PATH } from "../lib/quality/qualityStore.mjs";
const run = await collectLiveQuality({ environment: process.env.QUALITY_ENV || process.env.NODE_ENV || "local" });
const path = writeRun(run);
const compared = compareQuality(run, readHistory());
writeJson(path, compared.latest); writeJson(DASHBOARD_JSON_PATH, compared);
console.log(`Quality history persisted: ${path}`);
console.log(`PASS=${compared.latest.summary.passCount} REVIEW=${compared.latest.summary.reviewCount} CONFIRMED_RISK=${compared.latest.summary.confirmedRiskCount} REGRESSIONS=${compared.latest.summary.regressionCount}`);

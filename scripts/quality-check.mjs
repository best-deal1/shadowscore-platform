import { readJson, DASHBOARD_JSON_PATH, LATEST_PATH, readHistory } from "../lib/quality/qualityStore.mjs";
import { compareQuality } from "../lib/quality/compareQuality.mjs";
const compared = readJson(DASHBOARD_JSON_PATH) || compareQuality(readJson(LATEST_PATH), readHistory());
const regressions = compared.latest.regressions || [];
if (regressions.length) { console.error(`Meaningful product regressions detected: ${regressions.length}`); console.error(JSON.stringify(regressions, null, 2)); process.exit(1); }
console.log("No meaningful product regressions detected. Environment/public-source outages are tracked separately.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = ["components/ShadowScoreLayout.tsx", "components/AsyncState.tsx", "app/report/page.tsx", "app/monitoring/page.tsx"];
const source = files.map((file) => [file, readFileSync(file, "utf8")]);
const layout = source[0][1];
const asyncState = source[1][1];
assert.match(layout, /aria-label="Primary navigation"/);
assert.match(layout, /aria-controls="mobile-navigation"/);
assert.match(layout, /focus:ring-2/);
assert.match(asyncState, /role="status"/);
assert.match(asyncState, /role="alert"/);
assert.match(asyncState, /type="button"/);
for (const [file, content] of source) assert.ok(!content.includes("<img ") || content.includes("alt="), `${file} contains an image without alternative text.`);
console.log(`Accessibility guardrails validated across ${files.length} shared report and layout files.`);

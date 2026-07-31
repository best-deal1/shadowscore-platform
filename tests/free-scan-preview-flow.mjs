import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

rmSync('.tmp-tests', { recursive: true, force: true });
execFileSync('./node_modules/.bin/tsc', ['lib/freeScanPreviewFlow.ts', '--target', 'ES2022', '--module', 'CommonJS', '--moduleResolution', 'Node', '--outDir', '.tmp-tests', '--skipLibCheck'], { stdio: 'inherit' });
const require = createRequire(import.meta.url);
const flow = require('../.tmp-tests/freeScanPreviewFlow.js');

const completePayload = {
  status: 'ready',
  executedAt: '2026-07-16T00:00:00.000Z',
  providers: [{ providerId: 'dns', status: 'completed' }],
  decisionPreview: { decision: 'PASS' },
  reportReadyEvent: { type: 'free-preview-ready', status: 'ready', ready: true },
};

assert.equal(flow.isPreviewReadyResponse(completePayload), true, 'ready API payload exits loading');
assert.equal(flow.nextPreviewStatus(completePayload), 'ready', 'ready event maps to completed preview state');

const legacyCompletePayload = {
  executedAt: '2026-07-16T00:00:00.000Z',
  providers: [],
  decisionPreview: { decision: 'REVIEW' },
};
assert.equal(flow.isPreviewReadyResponse(legacyCompletePayload), true, 'legacy completed responses still exit loading');

await assert.rejects(
  () => flow.readPreviewJson({ ok: true, json: async () => ({ status: 'generating', providers: [] }) }),
  /preview-ready event was missing/,
  'incomplete API responses do not leave unresolved loading semantics',
);

await assert.rejects(
  () => flow.readPreviewJson({ ok: false, json: async () => ({ error: 'backend failed' }) }),
  /backend failed/,
  'API error responses surface the backend error',
);

const parsed = await flow.readPreviewJson({ ok: true, json: async () => completePayload });
assert.equal(parsed.status, 'ready', 'successful ready response resolves the JSON promise');

const source = readFileSync('app/intake/page.tsx', 'utf8');
assert.match(source, /isPreviewReadyResponse\(payload/, 'intake page checks the preview-ready API response');
assert.match(source, /setPreviewStatus\("ready"\)/, 'intake page transitions loading state to ready');
assert.match(source, /setFreeScanRunning\(false\)/, 'intake page clears the running flag');
assert.match(source, /Executive report ready/, 'free preview teases the completed executive report');
assert.match(source, /Evidence items collected/, 'free preview shows high-level collection totals');
assert.match(source, /Unlock Executive Report · \$9\.90/, 'free preview presents the one-time report purchase');
assert.doesNotMatch(source, /View technical preview/, 'free preview does not expose a technical report');
assert.doesNotMatch(source, /Why it matters:/, 'free preview does not expose finding explanations');
assert.doesNotMatch(source, /What this means:/, 'free preview does not expose decision reasoning');

const routeSource = readFileSync('app/api/free-scan/providers/route.ts', 'utf8');
const responseSource = routeSource.slice(routeSource.indexOf('return NextResponse.json({\n      status: "ready"'));
assert.match(routeSource, /previewSummary:/, 'free preview API returns only the summary needed by the conversion view');
assert.doesNotMatch(responseSource, /decisionPreview,\n/, 'free preview API does not return decision details');
assert.doesNotMatch(responseSource, /insights: insightOutput\.insights/, 'free preview API does not return insight details');

rmSync('.tmp-tests', { recursive: true, force: true });
console.log('free scan preview completion flow regression tests passed');

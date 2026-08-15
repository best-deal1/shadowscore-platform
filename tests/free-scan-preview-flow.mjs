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
const resultSource = readFileSync('components/quick-check/QuickCheckResult.tsx', 'utf8');
assert.match(source, /isPreviewReadyResponse\(payload/, 'intake page checks the preview-ready API response');
assert.match(source, /setPreviewStatus\("ready"\)/, 'intake page transitions loading state to ready');
assert.match(source, /setFreeScanRunning\(false\)/, 'intake page clears the running flag');
assert.match(source, /quickCheck\?: QuickCheckReport/, 'frontend preserves the complete Quick Check contract');
assert.match(resultSource, /Representative evidence/, 'Quick Check displays representative evidence');
assert.match(resultSource, /Successfully queried sources/, 'Quick Check displays successful source names');
assert.match(resultSource, /Evidence gaps/, 'Quick Check displays unresolved evidence gaps');
assert.match(resultSource, /What the Full Investigation adds/, 'Quick Check explains the paid investigation difference');
assert.doesNotMatch(resultSource, /Business found|Independent sources checked|Evidence items collected and documented|Commercial findings identified/, 'Quick Check removes misleading count-led claims');

const routeSource = readFileSync('app/api/free-scan/providers/route.ts', 'utf8');
const responseSource = routeSource.slice(routeSource.indexOf('return NextResponse.json({\n      status: "ready"'));
assert.match(responseSource, /quickCheck,/, 'free preview API returns the evidence-led Quick Check report');
assert.match(responseSource, /sourcesSuccessfullyQueried: quickCheck\.sourcesSuccessfullyQueried/, 'free preview API exposes successful source names');
assert.doesNotMatch(responseSource, /insights: insightOutput\.insights/, 'free preview API does not return insight details');

rmSync('.tmp-tests', { recursive: true, force: true });
console.log('free scan preview completion flow regression tests passed');

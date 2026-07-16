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

rmSync('.tmp-tests', { recursive: true, force: true });
console.log('free scan preview completion flow regression tests passed');

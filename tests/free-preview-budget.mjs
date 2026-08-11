import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

rmSync('.tmp-tests-preview-budget', { recursive: true, force: true });
execFileSync('./node_modules/.bin/tsc', ['lib/providers/ProviderManager.ts', 'lib/providers/types.ts', '--target', 'ES2022', '--module', 'CommonJS', '--moduleResolution', 'Node', '--outDir', '.tmp-tests-preview-budget', '--skipLibCheck'], { stdio: 'inherit' });
const require = createRequire(import.meta.url);
const { ProviderManager } = require('../.tmp-tests-preview-budget/providers/ProviderManager.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const context = { intakeId: 'test', scanMode: 'website', target: 'example.com', platform: 'Website / Business', fileNames: [], visibleSignalCategories: [], executionProfile: 'free_preview' };

function provider(id, delayMs, { fail = false, evidenceValue = 'observed', category = 'business_profile' } = {}) {
  return {
    id,
    name: `${id} Provider`,
    version: '1.0.0',
    category,
    async execute() {
      const startedAt = new Date();
      await sleep(delayMs);
      const completedAt = new Date();
      if (fail) {
        return { providerId: id, providerVersion: '1.0.0', status: 'skipped', startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), duration: completedAt - startedAt, findings: [], evidence: [], metadata: { category, providerName: `${id} Provider`, lookupPerformed: false, failureReason: 'Timeout' }, errors: ['Timeout'] };
      }
      return { providerId: id, providerVersion: '1.0.0', status: 'completed', startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), duration: completedAt - startedAt, findings: [], evidence: [{ id: `${id}-evidence`, type: 'observation', label: `${id} evidence`, value: evidenceValue, source: id }], metadata: { category, providerName: `${id} Provider`, lookupPerformed: true }, errors: [] };
    },
    normalize(value) { return value; }, confidence() { return 75; }, evidence(result) { return result.evidence; }, correlation() { return []; }, failureReason() { return 'Unavailable'; }, async health() { return { providerId: id, providerVersion: '1.0.0', status: 'healthy', checkedAt: new Date().toISOString(), metadata: {} }; },
  };
}

async function run(name, fn) {
  await fn();
  console.log(`✓ ${name}`);
}

await run('one slow provider is deferred without blocking useful evidence', async () => {
  const manager = new ProviderManager().registerMany([provider('dns', 10, { category: 'dns' }), provider('business-profile', 20), provider('social-profile', 250)]);
  const started = Date.now();
  const run = await manager.runFreePreview(context, { budgetMs: 80, concurrencyLimit: 3 });
  assert.ok(Date.now() - started < 140);
  assert.ok(run.providerResults.some((result) => result.providerId === 'dns' && result.status === 'completed'));
  assert.ok(run.providerResults.some((result) => result.providerId === 'social-profile' && result.metadata.previewClassification));
});

await run('several slow providers are classified after the budget', async () => {
  const manager = new ProviderManager().registerMany([provider('dns', 10, { category: 'dns' }), provider('whois', 300, { category: 'whois' }), provider('ssl', 300, { category: 'ssl' }), provider('contact-discovery', 300)]);
  const run = await manager.runFreePreview(context, { budgetMs: 70, concurrencyLimit: 4 });
  assert.ok(run.telemetry.deferredProviders.length >= 3);
  assert.ok(run.telemetry.deferredProviders.some((item) => item.classification === 'timed_out'));
});

await run('provider timeout is preserved in telemetry', async () => {
  const manager = new ProviderManager().registerMany([provider('dns', 5, { category: 'dns' }), provider('whois', 5, { category: 'whois', fail: true })]);
  const run = await manager.runFreePreview(context, { budgetMs: 100, concurrencyLimit: 2 });
  assert.equal(run.providerResults.find((result) => result.providerId === 'whois')?.metadata.failureReason, 'Timeout');
  assert.equal(run.telemetry.providerTimings.find((item) => item.providerId === 'whois')?.classification, 'timed_out');
});

await run('partial evidence preview contains completed evidence only', async () => {
  const manager = new ProviderManager().registerMany([provider('dns', 5, { category: 'dns' }), provider('business-profile', 5, { evidenceValue: 'Example Inc.' }), provider('social-profile', 200)]);
  const run = await manager.runFreePreview(context, { budgetMs: 50, concurrencyLimit: 3 });
  const completedEvidence = run.providerResults.filter((result) => result.status === 'completed').flatMap((result) => result.evidence);
  assert.ok(completedEvidence.some((item) => item.value === 'Example Inc.'));
  assert.ok(run.providerResults.filter((result) => result.status !== 'completed').every((result) => result.evidence.length === 0));
});

await run('preview completes within execution budget', async () => {
  const manager = new ProviderManager().registerMany([provider('dns', 20, { category: 'dns' }), provider('whois', 250, { category: 'whois' }), provider('ssl', 250, { category: 'ssl' })]);
  const started = Date.now();
  const run = await manager.runFreePreview(context, { budgetMs: 60, concurrencyLimit: 3 });
  assert.ok(Date.now() - started < 120);
  assert.ok(run.telemetry.elapsedMs <= 90);
});

const route = readFileSync('app/api/free-scan/providers/route.ts', 'utf8');
assert.match(route, /Quick Check ready\. Review the evidence and gaps before paying\./);
assert.match(route, /runFreePreview\(context, \{ budgetMs: 12_000, concurrencyLimit: 5 \}\)/);

rmSync('.tmp-tests-preview-budget', { recursive: true, force: true });
console.log('free preview execution budget regression tests passed');

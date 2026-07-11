import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { rmSync } from 'node:fs';

execFileSync('npx', ['tsc', '--module', 'commonjs', '--target', 'es2022', '--esModuleInterop', '--skipLibCheck', '--outDir', '.tmp-provider-tests', 'lib/providers/productionProviders.ts', 'lib/providers/BaseProvider.ts', 'lib/providers/types.ts'], { stdio: 'inherit' });
const providers = await import('../.tmp-provider-tests/productionProviders.js');
const { SPFProvider, DMARCProvider, SecurityHeadersProvider, BusinessProfileProvider, ReputationProvider } = providers;

function ctx(target, email) { return { intakeId: 'test', scanMode: 'paid', target, platform: 'web', email, fileNames: [], visibleSignalCategories: [] }; }
async function run(name, fn) { try { await fn(); console.log(`ok - ${name}`); } catch (e) { console.error(`not ok - ${name}`); throw e; } }

const server = createServer((req, res) => { res.setHeader('Strict-Transport-Security', 'max-age=31536000'); res.setHeader('Content-Security-Policy', "default-src 'self'"); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.end('<title>Acme Enterprise</title><meta name="description" content="Trusted business"><script type="application/ld+json">{"@type":"Organization","name":"Acme Enterprise"}</script>Contact ops@example.com +1 555 123 4567 https://linkedin.com/company/acme'); });
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

await run('Healthy enterprise', async () => { const r = await new SecurityHeadersProvider().execute(ctx(`http://localhost:${port}`)); assert.equal(r.status, 'completed'); assert.ok(r.evidence.length > 3); });
await run('Small business', async () => { const r = await new BusinessProfileProvider().execute(ctx(`http://localhost:${port}`)); assert.equal(r.status, 'completed'); assert.match(JSON.stringify(r.evidence), /Acme Enterprise/); });
await run('Domain only', async () => { const r = await new ReputationProvider().execute(ctx('example.com')); assert.equal(r.status, 'completed'); });
await run('Email only', async () => { const r = await new SPFProvider().execute(ctx('owner@example.com', 'owner@example.com')); assert.ok(['completed','skipped'].includes(r.status)); });
await run('No DNS', async () => { const r = await new SPFProvider().execute(ctx('nonexistent.invalid')); assert.equal(r.status, 'completed'); assert.match(JSON.stringify(r.evidence), /unavailable/); });
await run('SSL failure', async () => { const r = await new providers.SSLProvider().execute(ctx(`http://localhost:${port}`)); assert.equal(r.status, 'skipped'); assert.match(JSON.stringify(r.metadata), /Unavailable|Timeout/); });
await run('DMARC missing', async () => { const r = await new DMARCProvider().execute(ctx('example.com')); assert.equal(r.status, 'completed'); assert.ok(r.evidence.some((e) => e.id === 'dmarc-record')); });
await run('Provider timeout', async () => { class T extends providers.ProductionProvider { id='timeout'; name='Timeout'; version='1'; category='reputation'; async collect(){ throw new Error('Timeout'); } } const r = await new T().execute(ctx('example.com')); assert.equal(r.status, 'skipped'); assert.equal(r.metadata.failureReason, 'Timeout'); });
await run('Mixed provider availability', async () => { const rs = await Promise.all([new ReputationProvider().execute(ctx('example.com')), new SPFProvider().execute(ctx('bad'))]); assert.equal(rs.length, 2); assert.ok(rs.some((r) => r.status === 'completed')); assert.ok(rs.some((r) => r.status === 'skipped')); });
server.close();
rmSync('.tmp-provider-tests', { recursive: true, force: true });

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url); const tscPath = require.resolve("typescript/bin/tsc"); const outDir = join(tmpdir(), "shadowscore-http-diagnostics-validation"); rmSync(outDir,{recursive:true,force:true});
execFileSync(process.execPath,[tscPath,"lib/providers/productionProviders.ts","--outDir",outDir,"--module","commonjs","--target","es2020","--esModuleInterop","--skipLibCheck","--moduleResolution","node","--noEmit","false"],{stdio:"inherit"});
const providers = require(join(outDir,"productionProviders.js"));
const required = ["requestedUrl","redirectCount","redirectChain","durationMs","timeoutMs","bodyBytesRead","responseWasHtml","userAgent","tlsStatus","failureStage","aborted","possibleBotProtection","possibleChallengePage"];
const sites = ["gadgetdeals.co.il","ksp.co.il","bankhapoalim.co.il","bug.co.il","keter.com","barinaeng.co.il"];
const httpProviders = [new providers.SecurityHeadersProvider(), new providers.BusinessProfileProvider(), new providers.WebsiteMetadataProvider(), new providers.ContactDiscoveryProvider(), new providers.SocialProfileProvider()];
const rows = [];
for (const site of sites) {
  const context = { intakeId:`http-diag-${site}`, scanMode:"website", target:site, platform:"web", email:`ops@${site}`, fileNames:[], visibleSignalCategories:[] };
  const results = [];
  for (const provider of httpProviders) results.push(await provider.execute(context));
  const diag = results[0].metadata.httpDiagnostics;
  assert.ok(diag, `${site} missing shared HTTP diagnostics`); for (const key of required) assert.ok(key in diag, `${site} missing ${key}`);
  assert.notEqual(diag.failureStage, undefined, `${site} emitted fetch failed without failureStage`);
  const names = results.find((r)=>r.providerId === "business-profile").evidence.filter((e)=>/Business name|Business profile title/.test(e.label)).map((e)=>e.value).join(" ");
  assert.ok(!/Forbidden 403/i.test(names), `${site} accepted error page title as business identity`);
  assert.ok(results.every((r)=>!r.findings.some((f)=>/verification gap|identity contradiction|business risk/i.test(`${f.title} ${f.description}`))), `${site} acquisition failure created business risk`);
  rows.push({ site, outcome: results[1].metadata.httpOutcome || diag.failureStage, status: diag.statusCode, stage: diag.failureStage, finalUrl: diag.finalUrl, bytes: diag.bodyBytesRead, bot: diag.possibleBotProtection, sharedFetches: context.sharedHttpFetchCount });
}
console.table(rows); console.log("http diagnostics validation passed");

import { execFileSync, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const targets = ["google.com", "stripe.com", "microsoft.com", "ynet.co.il", "bankhapoalim.co.il", "leumi.co.il"];
const targetTimeoutMs = Number(process.env.SHADOWSCORE_TARGET_TIMEOUT_MS || 45_000);
const outDir = join(tmpdir(), "shadowscore-production-pipeline-telemetry");

function compileProductionPipeline() {
  rmSync(outDir, { recursive: true, force: true });
  execFileSync("npx", [
    "tsc",
    "lib/reportPipeline.ts",
    "--outDir",
    outDir,
    "--module",
    "commonjs",
    "--target",
    "es2020",
    "--esModuleInterop",
    "--skipLibCheck",
    "--moduleResolution",
    "node",
    "--noEmit",
    "false",
  ], { stdio: "inherit" });
}

function productionInput(target) {
  return {
    intake: {
      intakeId: `telemetry-${target}`,
      userId: "validation-user",
      scanMode: "website",
      target,
      platform: "public_web",
      caseType: "pre_merge_environment_validation",
      email: undefined,
      fileNames: [],
      visibleSignalCategories: [],
      createdAt: new Date().toISOString(),
      status: "submitted",
    },
    paymentIntent: {
      id: `paid-${target}`,
      intakeId: `telemetry-${target}`,
      userId: "validation-user",
      amountCents: 0,
      currency: "usd",
      paymentStatus: "paid",
      provider: "validation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function summarizeProvider(result) {
  return {
    providerId: result.providerId,
    providerVersion: result.providerVersion,
    status: result.status,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    durationMs: result.duration,
    evidenceCount: result.evidence.length,
    findingCount: result.findings.length,
    failureReason: result.metadata?.failureReason || null,
    integrationStatus: result.metadata?.integrationStatus || null,
    lookupPerformed: result.metadata?.lookupPerformed ?? null,
    metadata: result.metadata,
    errors: result.errors,
  };
}

async function runChild(target) {
  const require = createRequire(import.meta.url);
  const { buildReadyReport, REPORT_ENGINE_VERSION } = require(join(outDir, "reportPipeline.js"));
  const report = await buildReadyReport(productionInput(target));
  const providers = report.providerResults.map(summarizeProvider);
  console.log(JSON.stringify({
    target,
    engineVersion: REPORT_ENGINE_VERSION,
    reportId: report.reportId,
    execution: report.reportSummary.execution,
    technicalDetails: report.reportSummary.technicalDetails,
    providers,
  }));
}

if (process.argv[2] === "--child") {
  await runChild(process.argv[3]);
} else {
  compileProductionPipeline();
  const telemetry = [];
  let failed = false;

  for (const target of targets) {
    const child = spawnSync(process.execPath, [process.argv[1], "--child", target], {
      encoding: "utf8",
      timeout: targetTimeoutMs,
      env: { ...process.env, SHADOWSCORE_PIPELINE_COMPILED_OUT_DIR: outDir },
    });

    if (child.status === 0 && child.stdout.trim()) {
      const result = JSON.parse(child.stdout.trim().split("\n").at(-1));
      if (result.providers.some((provider) => provider.status !== "completed")) failed = true;
      telemetry.push(result);
    } else {
      failed = true;
      telemetry.push({
        target,
        status: "pipeline_timeout_or_crash",
        timeoutMs: targetTimeoutMs,
        signal: child.signal,
        exitCode: child.status,
        stderr: child.stderr,
        stdout: child.stdout,
      });
    }
  }

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      httpsProxyConfigured: Boolean(process.env.HTTPS_PROXY || process.env.https_proxy),
      httpProxyConfigured: Boolean(process.env.HTTP_PROXY || process.env.http_proxy),
      noProxy: process.env.NO_PROXY || process.env.no_proxy || "",
    },
    targets,
    telemetry,
  }, null, 2));

  if (failed) process.exitCode = 1;
}

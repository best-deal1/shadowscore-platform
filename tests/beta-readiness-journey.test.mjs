import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

test("beta purchase journey uses workspace as its canonical authenticated page", async () => {
  const [layout, config, login, investigations, proxy, home] = await Promise.all([
    read("components/ShadowScoreLayout.tsx"),
    read("next.config.ts"),
    read("app/login/page.tsx"),
    read("app/investigations/page.tsx"),
    read("proxy.ts"),
    read("app/HomeClient.tsx"),
  ]);
  assert.match(layout, /href="\/intake"/);
  assert.match(config, /source: "\/dashboard", destination: "\/workspace"/);
  assert.doesNotMatch(config, /source: "\/workspace"/);
  assert.match(config, /source: "\/reports", destination: "\/archive"/);
  assert.match(login, /\|\| "\/workspace"/);
  assert.match(investigations, /redirect\("\/workspace"\)/);
  assert.match(proxy, /request\.nextUrl\.pathname === "\/investigations"/);
  assert.match(proxy, /NextResponse\.redirect\(new URL\("\/workspace", request\.url\)\)/);
  assert.match(home, /One Business Investigation produces one Executive Report for a one-time price of \$9\.90/);
});

test("intake confirms Business, scope, deliverable, and price before payment", async () => {
  const intake = await read("app/intake/page.tsx");
  for (const copy of ["Confirm the Business and scope before payment", "Investigation scope", "Optional customer Evidence", "Executive Report", "$9.90", "Customer email (required)"]) assert.ok(intake.includes(copy), copy);
  assert.match(intake, /CHECKOUT_DRAFT_KEY/);
});

test("payment and Investigation statuses remain separate", async () => {
  const flow = await read("app/reports/[reportId]/ReportFlow.tsx");
  assert.match(flow, /Payment confirmed/);
  assert.match(flow, /Investigation status/);
  assert.match(flow, /You can safely close this page/);
  assert.match(flow, /Check its status from Investigations or the Archive/);
});

test("Archive and report provide retrieval, print identity, and repeat purchase", async () => {
  const [archive, report] = await Promise.all([read("app/archive/ArchiveWorkspace.tsx"), read("components/report/ExecutiveIntelligenceReport.tsx")]);
  assert.match(archive, /Open investigation/);
  assert.match(archive, /View investigations/);
  assert.match(report, /window\.print/);
  assert.match(report, /Investigation \{report\.intakeId \|\| report\.reportId\}/);
  assert.match(report, /Version 1\.0/);
  assert.match(report, /requires the recipient to sign in/);
});

test("public navigation preserves authenticated customer continuity", async () => {
  const layout = await read("components/ShadowScoreLayout.tsx");
  assert.match(layout, /setUser\(getCurrentUser\(\)\)/);
  assert.match(layout, /Checking account status/);
  assert.match(layout, /Open workspace/);
  assert.match(layout, /Profile and account/);
  assert.match(layout, /Signed in as \{user\.email\}/);
  assert.match(layout, /await logoutUser\(\)/);
  assert.match(layout, /event\.key === "Escape"/);
  assert.doesNotMatch(layout, /Connected: \{user\.email\}/);
});

test("current beta preserves the approved infinity assets byte-for-byte", async () => {
  const [primaryMark, monoMark, browserIcon, brandSystem] = await Promise.all([
    read("public/brand/shadowscore-infinity.svg"),
    read("public/brand/shadowscore-infinity-mono.svg"),
    read("app/icon.svg"),
    read("docs/SHADOWSCORE_BRAND_SYSTEM.md"),
  ]);

  for (const asset of [primaryMark, monoMark, browserIcon]) {
    assert.match(asset, /ShadowScore infinity mark/);
    assert.doesNotMatch(asset, /production logo|evidence network mark/i);
  }

  assert.equal(sha256(primaryMark), "c5f8d30f4e046c278803256757f12748e467d02bb385d04f659b3f3bbb109733");
  assert.equal(sha256(monoMark), "f7e35fd5d17b487762f9f001d8db0c001b489f83fc2baa949d203d08aa0c58bd");
  assert.equal(sha256(browserIcon), "bd8df396725e2e729fed98fb7d14bf4bff673a355062281afe01d03e4ed06c92");
  assert.match(brandSystem, /shadowscore-infinity-mono\.svg/);
  assert.match(brandSystem, /Clear space/);
  assert.match(brandSystem, /Typography/);
  assert.match(brandSystem, /WCAG contrast requirements/);

  for (const retiredAsset of [
    "public/brand/shadowscore-logo.svg",
    "public/brand/shadowscore-logo-mono.svg",
    "public/shadowscore-shield.png",
    "public/shadowscore-main-logo.jpg",
  ]) {
    await assert.rejects(access(new URL(`../${retiredAsset}`, import.meta.url)));
  }
});

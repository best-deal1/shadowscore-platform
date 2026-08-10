import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public header and product surfaces use the canonical production logo", async () => {
  const [brand, publicHeader, workspace, intake, rootMetadata, pageMetadata, marketingMetadata] = await Promise.all([
    read("lib/brand.ts"), read("components/ShadowScoreLayout.tsx"),
    read("components/workspace/WorkspaceShell.tsx"), read("app/intake/page.tsx"),
    read("app/layout.tsx"), read("app/lib/seo.ts"), read("app/lib/marketing.ts"),
  ]);

  assert.match(brand, /CANONICAL_LOGO_PATH = "\/brand\/shadowscore-infinity\.svg"/);
  for (const surface of [publicHeader, workspace, intake, rootMetadata, pageMetadata, marketingMetadata]) assert.match(surface, /CANONICAL_LOGO_PATH/);
  assert.match(publicHeader, /src=\{CANONICAL_LOGO_PATH\}/);
  assert.match(publicHeader, /src=\{CANONICAL_LOGO_PATH\}[\s\S]*unoptimized/);
  assert.match(rootMetadata, /logo: CANONICAL_LOGO_URL/);
  assert.match(rootMetadata, /icon: \[\{ url: CANONICAL_LOGO_PATH/);
  assert.match(rootMetadata, /openGraph:[\s\S]*images:[\s\S]*CANONICAL_LOGO_PATH/);
  assert.match(rootMetadata, /twitter:[\s\S]*images: \[CANONICAL_LOGO_PATH\]/);
});

test("legacy runtime logo sources stay retired", async () => {
  for (const path of ["app/icon.svg", "public/shadowscore-og.jpg", "public/brand/shadowscore-logo.svg"]) {
    await assert.rejects(access(new URL(`../${path}`, import.meta.url)));
  }
});

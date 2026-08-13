import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public header and product surfaces use the canonical production logo", async () => {
  const [brand, publicHeader, workspace, intake, rootMetadata, homeMetadata, pageMetadata, marketingMetadata] = await Promise.all([
    read("lib/brand.ts"), read("components/ShadowScoreLayout.tsx"),
    read("components/workspace/WorkspaceShell.tsx"), read("app/intake/page.tsx"),
    read("app/layout.tsx"), read("app/page.tsx"), read("app/lib/seo.ts"), read("app/lib/marketing.ts"),
  ]);

  assert.match(brand, /CANONICAL_LOGO_PATH = "\/brand\/shadowscore-infinity\.svg"/);
  for (const surface of [publicHeader, workspace, intake, rootMetadata]) assert.match(surface, /CANONICAL_LOGO_PATH/);
  assert.match(publicHeader, /src=\{CANONICAL_LOGO_PATH\}/);
  assert.match(publicHeader, /src=\{CANONICAL_LOGO_PATH\}[\s\S]*unoptimized/);
  assert.match(rootMetadata, /logo: CANONICAL_LOGO_URL/);
  assert.match(rootMetadata, /icon: \[\{ url: CANONICAL_LOGO_PATH/);
  for (const metadata of [rootMetadata, homeMetadata, pageMetadata, marketingMetadata]) {
    assert.match(metadata, /SOCIAL_PREVIEW_PATH/);
  }
  assert.match(rootMetadata, /alternates: \{ canonical: "https:\/\/shadowscore\.io\/" \}/);
  assert.match(homeMetadata, /alternates: \{ canonical: "https:\/\/shadowscore\.io\/"/);
});

test("social previews use the generated 1200 by 630 image route", async () => {
  const image = await read("app/opengraph-image.tsx");

  assert.match(image, /ImageResponse/);
  assert.match(image, /width: 1200/);
  assert.match(image, /height: 630/);
  assert.match(image, /ShadowScore \| Business Trust Intelligence \| Due Diligence/);
});

test("legacy runtime logo and binary social preview sources stay retired", async () => {
  for (const path of ["app/icon.svg", "public/shadowscore-og.jpg", "public/brand/shadowscore-logo.svg", "public/brand/shadowscore-social-preview.png"]) {
    await assert.rejects(access(new URL(`../${path}`, import.meta.url)));
  }
});

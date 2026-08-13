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
  for (const metadata of [pageMetadata, marketingMetadata]) {
    assert.match(metadata, /SOCIAL_PREVIEW_PATH/);
  }
  for (const metadata of [rootMetadata, homeMetadata]) assert.match(metadata, /SOCIAL_PREVIEW_URL/);
  assert.match(rootMetadata, /alternates: \{ canonical: "https:\/\/shadowscore\.io\/" \}/);
  assert.match(homeMetadata, /alternates: \{ canonical: "https:\/\/shadowscore\.io\/"/);
});

test("social previews use the generated 1200 by 630 image route", async () => {
  const [brand, layout, home, route, image] = await Promise.all([
    read("lib/brand.ts"),
    read("app/layout.tsx"),
    read("app/page.tsx"),
    read("app/social-preview.png/route.tsx"),
    read("lib/socialPreviewImage.tsx"),
  ]);

  assert.match(brand, /SOCIAL_PREVIEW_PATH = "\/social-preview\.png"/);
  assert.match(brand, /SOCIAL_PREVIEW_URL = `https:\/\/shadowscore\.io\$\{SOCIAL_PREVIEW_PATH\}`/);
  assert.match(layout, /SOCIAL_PREVIEW_URL/);
  assert.match(home, /url: SOCIAL_PREVIEW_URL, width: 1200, height: 630, type: "image\/png"/);
  assert.match(route, /dynamic = "force-static"/);
  assert.match(route, /Cache-Control/);
  assert.match(image, /ImageResponse/);
  assert.match(image, /width: 1200/);
  assert.match(image, /height: 630/);
  assert.match(image, /Business Due Diligence &amp; Company Verification/);
});

test("homepage metadata keeps one exact social preview contract", async () => {
  const [layout, home] = await Promise.all([read("app/layout.tsx"), read("app/page.tsx")]);
  const title = "ShadowScore | Business Due Diligence & Company Verification";
  const description = "Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.";

  for (const metadata of [layout, home]) {
    assert.equal(metadata.split(title).length - 1, 1);
    assert.equal(metadata.split(description).length - 1, 1);
  }
});

test("legacy runtime logo and binary social preview sources stay retired", async () => {
  for (const path of ["app/icon.svg", "app/opengraph-image.tsx", "public/shadowscore-og.jpg", "public/brand/shadowscore-logo.svg", "public/brand/shadowscore-social-preview.png"]) {
    await assert.rejects(access(new URL(`../${path}`, import.meta.url)));
  }
});

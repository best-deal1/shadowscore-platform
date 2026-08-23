import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pages = fs.readFileSync("app/lib/public-pages.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const robots = fs.readFileSync("app/robots.ts", "utf8");
const metadata = fs.readFileSync("app/lib/public-metadata.ts", "utf8");
const nav = fs.readFileSync("components/ShadowScoreLayout.tsx", "utf8");
const requiredRoutes = ["/platform", "/solutions", "/solutions/business-due-diligence", "/solutions/vendor-risk", "/solutions/marketplace-seller-risk", "/solutions/fraud-investigation", "/solutions/entity-intelligence", "/solutions/digital-identity", "/data", "/data/entity-graph", "/data/open-web-intelligence", "/data/business-and-registry-data", "/data/digital-identity-signals", "/product/investigations", "/product/executive-reports", "/product/monitoring", "/product/alerts", "/resources", "/resources/guides", "/resources/research", "/company"];

test("public content model defines every V1 route", () => {
  for (const route of requiredRoutes) assert.match(pages, new RegExp(`\\["${route.replaceAll("/", "\\/")}"`), route);
});

test("public metadata provides canonical and social metadata", () => {
  assert.match(metadata, /alternates: \{ canonical: page\.path \}/);
  assert.match(metadata, /openGraph:/);
  assert.match(metadata, /robots: \{ index: true, follow: true \}/);
});

test("sitemap includes the public content model", () => assert.match(sitemap, /publicPaths/));

test("robots excludes customer and account route families", () => {
  for (const route of ["/account", "/admin", "/investigations", "/reports", "/workspace"]) assert.match(robots, new RegExp(`"${route}"`));
});

test("primary navigation links to indexable architecture hubs", () => {
  for (const route of ["/platform", "/solutions", "/data", "/resources"]) assert.match(nav, new RegExp(`href: "${route}"`));
});

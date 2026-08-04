import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const commercialSurfaces = [
  "app/components/MarketingHome.tsx",
  "app/HomeClient.tsx",
  "app/pricing/page.tsx",
  "app/sample-report/page.tsx",
  "app/intake/page.tsx",
  "app/investigations/_components/InvestigationWorkspace.tsx",
];

test("customer-facing pricing references use the canonical commercial catalog", async () => {
  const sources = await Promise.all(commercialSurfaces.map(read));
  for (const [index, source] of sources.entries()) {
    assert.match(source, /BETA_PRODUCT/, `${commercialSurfaces[index]} must use the canonical product`);
    assert.doesNotMatch(source, /\$9\.90/, `${commercialSurfaces[index]} must not duplicate the price literal`);
  }
});

test("pricing presents every commercial path from one catalog", async () => {
  const [catalog, pricing, home] = await Promise.all([
    read("lib/pricing.ts"),
    read("app/pricing/page.tsx"),
    read("app/components/MarketingHome.tsx"),
  ]);
  for (const plan of ["Professional", "Business", "Enterprise"]) assert.match(catalog, new RegExp(`name: "${plan}"`));
  assert.match(pricing, /PLANNED_PLANS\.map/);
  assert.match(pricing, /PLAN_COMPARISON\.map/);
  assert.match(home, /COMMERCIAL_PATHS\.teamPlans/);
});

test("authenticated navigation provides a route back to the public product", async () => {
  const shell = await read("components/workspace/WorkspaceShell.tsx");
  assert.match(shell, /href="\/"[\s\S]*ShadowScore website/);
});

test("platform marketing pages use the complete public product shell", async () => {
  const marketingPage = await read("app/components/MarketingPage.tsx");
  assert.match(marketingPage, /<ShadowScoreLayout>/);
  assert.doesNotMatch(marketingPage, /<nav aria-label="Breadcrumb"/);
});

test("about presents a complete commercial company story", async () => {
  const about = await read("app/about/page.tsx");
  for (const destination of ["/intake", "/sample-report", "/contact"]) {
    assert.match(about, new RegExp(`href="${destination}"`));
  }
  assert.match(about, /ShadowScore at a glance/);
  assert.match(about, /Evidence before conclusions/);
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { emailReportFixture, fixtureEmail, fixtureSnippet } from "./helpers/email-report-fixture.mjs";
import { renderPersonalReport } from "./helpers/render-personal-report.mjs";

const output = path.resolve("test-results/intake-browser/identity-report");
const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const result = { sourceSha, component: "PersonalIdentityReport", browser: "Chromium", serviceMode: "production pipeline with isolated search transport", cases: [], passed: false };
const staticRoot = path.resolve(".next/static");
const cssFiles = (await readdir(staticRoot, { recursive: true })).filter((file) => file.endsWith(".css"));
assert.ok(cssFiles.length, "A production build is required before report browser verification.");
const css = (await Promise.all(cssFiles.map((file) => readFile(path.join(staticRoot, file), "utf8")))).join("\n");
const wrap = (markup) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email-only identity report fixture</title><style>${css}</style></head><body><main class="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8"><p class="mb-4 text-sm text-slate-600">Fictional test data. No live investigation or payment.</p>${markup}</main></body></html>`;
const fixtures = new Map();
for (const scenario of ["found", "multi_hop", "partial", "empty", "unavailable"]) {
  const fixture = await emailReportFixture({ scenario });
  fixtures.set(scenario, { ...fixture, html: wrap(await renderPersonalReport(fixture.customer)) });
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function assertLayout(page, width) {
  const layout = await page.evaluate(() => {
    const root = document.querySelector(".personal-identity-report");
    const clipped = [...document.querySelectorAll("h1,h2,h3,h4,p,dd,blockquote,li")].flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1)
        ? [{ element: element.tagName, text: element.textContent.slice(0, 90), left: box.left, right: box.right }] : [];
    });
    return { viewport: innerWidth, document: document.documentElement.scrollWidth, report: root.clientWidth, reportContent: root.scrollWidth, clipped };
  });
  assert.equal(layout.viewport, width);
  assert.ok(layout.document <= width + 1, JSON.stringify(layout));
  assert.ok(layout.reportContent <= layout.report + 1, JSON.stringify(layout));
  assert.deepEqual(layout.clipped, [], JSON.stringify(layout));
  return layout;
}

try {
  for (const viewport of [{ width: 1363, height: 936, mobile: false }, { width: 390, height: 844, mobile: true }, { width: 320, height: 800, mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.mobile, hasTouch: viewport.mobile, reducedMotion: "reduce", serviceWorkers: "block" });
    const requests = [];
    const errors = [];
    await context.route("**/*", (route) => { requests.push(route.request().url()); return route.abort("blockedbyclient"); });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    if (viewport.width !== 390) {
      await page.setContent(wrap(await readFile("tests/fixtures/personal-report-before.html", "utf8")));
      await page.screenshot({ path: path.join(output, `before-${viewport.width}.jpg`), fullPage: true, type: "jpeg", quality: 80 });
    }
    for (const [scenario, fixture] of fixtures) {
      await page.setContent(fixture.html);
      const layout = await assertLayout(page, viewport.width);
      const execution = page.locator('[aria-labelledby="discovery-execution"]');
      assert.ok((await execution.textContent()).includes(String(fixture.customer.reportSummary.discoveryExecution.searchesCompleted)));
      assert.equal(await page.getByText("Discovery Diagnostics", { exact: true }).count(), 0);
      if (scenario === "found" || scenario === "partial") {
        assert.ok(await page.getByRole("heading", { name: "Identity finding", exact: true }).isVisible());
        assert.ok(await page.locator("blockquote").filter({ hasText: fixtureSnippet }).isVisible());
        assert.ok((await page.locator('[aria-labelledby="identity-finding"]').textContent()).includes("Dana Example"));
        assert.ok(await page.getByRole("heading", { name: "Discovery path", exact: true }).isVisible());
        assert.equal(await page.getByText("Verified Candidate", { exact: true }).count(), 0);
        const link = page.getByRole("link", { name: "Review identity evidence and sources", exact: true });
        if (viewport.mobile) await link.tap(); else await link.click();
        assert.equal(new URL(page.url()).hash, "#candidate-title");
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      if (scenario === "partial") {
        assert.ok((await execution.textContent()).includes("Partial coverage"));
        assert.ok((await execution.textContent()).includes("2 attempted"));
        assert.ok((await execution.textContent()).includes("limited further requests"));
      }
      if (scenario === "multi_hop") {
        assert.ok(await page.locator('a[href="https://instagram.com/dana.river"]').count() > 0);
        assert.equal(await page.getByText("Verified Candidate", { exact: true }).count(), 0);
      }
      if (scenario === "empty") assert.ok(await page.getByText("Identity remains unresolved", { exact: true }).isVisible());
      if (scenario === "unavailable") assert.ok(await page.getByText("Public identity search unavailable", { exact: true }).isVisible());
      await page.screenshot({ path: path.join(output, `${scenario}-${viewport.width}.jpg`), fullPage: true, type: "jpeg", quality: 80 });
      if (viewport.width === 1363 && scenario === "found") {
        await page.emulateMedia({ media: "print" });
        assert.ok(await page.getByRole("heading", { name: fixtureEmail, exact: true }).isVisible());
        assert.ok(await page.locator("blockquote").filter({ hasText: fixtureSnippet }).isVisible());
        assert.ok(await page.getByRole("heading", { name: "Discovery path", exact: true }).isVisible());
        await page.emulateMedia({ media: "screen" });
      }
      result.cases.push({ scenario, viewport, layout, execution: fixture.customer.reportSummary.discoveryExecution, passed: true });
    }
    assert.deepEqual(requests, [], "The report fixture must not access any external source.");
    assert.deepEqual(errors, [], "The report component must render without browser errors.");
    await context.close();
  }
  result.passed = true;
} finally {
  await browser.close();
  await writeFile(path.join(output, "results.json"), JSON.stringify(result, null, 2));
}
console.log(JSON.stringify({ sourceSha, passed: result.passed, cases: result.cases.length, output }));

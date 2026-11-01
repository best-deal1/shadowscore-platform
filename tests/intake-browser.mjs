import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:3107";
const output = path.resolve("test-results/intake-browser");
const requestText = "Find phone for Dana Example who is owner at Example Labs";
const modes = {
  personal: /Multiple signals Personal identity/,
  website: /No upload required Website \/ Business/,
};
const user = { id: "browser-fixture-user", name: "Browser Fixture", email: "buyer@example.invalid", createdAt: "2026-01-01T00:00:00Z" };
const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const report = { sourceSha, browser: "Chromium", serviceMode: "local fixtures", cases: [], passed: false };
const serverLog = [];
let browser;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3107"], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [server.stdout, server.stderr]) stream.on("data", (data) => serverLog.push(data.toString()));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function until(check, message, timeout = 20_000) {
  const end = Date.now() + timeout;
  let cause;
  while (Date.now() < end) {
    try { await check(); return; } catch (error) { cause = error; }
    await delay(50);
  }
  throw new Error(message, { cause });
}

async function makePage(settings) {
  const context = await browser.newContext({
    viewport: { width: settings.width, height: settings.height },
    isMobile: settings.mobile, hasTouch: settings.mobile,
    deviceScaleFactor: 1, reducedMotion: "reduce", serviceWorkers: "block",
  });
  const fixture = { intakes: [], intents: [], unexpected: [], consoleErrors: [], previewGate: null, previewStarted: null };
  await context.addInitScript((actor) => sessionStorage.setItem("shadowscore.session.v19", JSON.stringify(actor)), user);
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      fixture.unexpected.push(route.request().url());
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", (error) => fixture.consoleErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") fixture.consoleErrors.push(message.text());
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/auth/session") return route.fulfill({ json: { user } });
    if (pathname === "/api/free-scan/providers") {
      const payload = request.postDataJSON();
      fixture.previewStarted = true;
      if (fixture.previewGate) await fixture.previewGate.promise;
      return route.fulfill({ json: { status: "ready", executedAt: "2026-01-01T00:00:00Z", targetResolution: { requestedTarget: payload.target } } });
    }
    if (pathname === "/api/intakes") {
      const intake = { ...request.postDataJSON(), intakeId: `fixture-intake-${fixture.intakes.length + 1}`, userId: user.id,
        paymentStatus: "payment_pending", reportStatus: "preview", createdAt: user.createdAt };
      fixture.intakes.push(intake);
      return route.fulfill({ json: { intake } });
    }
    if (pathname === "/api/checkout/intent") {
      const payload = request.postDataJSON();
      fixture.intents.push(payload.intakeId);
      assert.ok(fixture.intakes.some((intake) => intake.intakeId === payload.intakeId));
      return route.fulfill({ json: { intent: { reportId: "fixture-report" }, reportId: "fixture-report" } });
    }
    fixture.unexpected.push(pathname);
    return route.abort("blockedbyclient");
  });
  // The checkout boundary is a fixture. No payment provider or report job runs.
  await page.route("**/reports/fixture-report/unlock", (route) => route.fulfill({
    contentType: "text/html", body: "<html><body><h1>Fixture checkout reached</h1></body></html>",
  }));
  return { context, page, fixture };
}

async function activate(locator, mobile) {
  if (mobile) await locator.tap(); else await locator.click();
}

const target = (page) => page.getByPlaceholder("Website, company, email, phone or marketplace seller...", { exact: true });
const start = (page) => page.getByRole("button", { name: "Start Investigation", exact: true });

async function openReview(page, mobile) {
  await activate(start(page), mobile);
  const full = page.getByRole("button", { name: "Run Full Investigation · $9.90", exact: true });
  await full.waitFor({ state: "visible" });
  await activate(full, mobile);
  await page.locator("#paid-intake-title").waitFor({ state: "visible" });
}

async function verifyWidth(page, width) {
  const sizes = await page.evaluate(() => {
    const main = document.querySelector("main");
    const clipped = [...document.querySelectorAll("input,select,textarea,button,h1,h2,fieldset")].flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1)
        ? [{ element: element.tagName, label: element.getAttribute("aria-label") || element.textContent?.slice(0, 60), left: box.left, right: box.right }] : [];
    });
    return { viewport: innerWidth, document: document.documentElement.scrollWidth,
      mainWidth: main.clientWidth, mainContentWidth: main.scrollWidth, mainScrollLeft: main.scrollLeft, clipped };
  });
  assert.equal(sizes.viewport, width);
  assert.ok(sizes.document <= sizes.viewport + 1, `Horizontal overflow: ${JSON.stringify(sizes)}`);
  assert.ok(sizes.mainContentWidth <= sizes.mainWidth + 1, `Clipped main content: ${JSON.stringify(sizes)}`);
  assert.equal(sizes.mainScrollLeft, 0, "The main container scrolled horizontally to reach a control");
  assert.deepEqual(sizes.clipped, [], "An input, button, fieldset, or heading extends outside the viewport");
  return sizes;
}

try {
  await mkdir(output, { recursive: true });
  await until(async () => { assert.ok((await fetch(`${origin}/intake`, { signal: AbortSignal.timeout(1500) })).ok); }, "Production server did not become ready", 45_000);
  browser = await chromium.launch({ headless: true });
  for (const settings of [
    { name: "desktop", width: 1363, height: 936, mobile: false },
    { name: "mobile-390", width: 390, height: 844, mobile: true },
    { name: "mobile-320", width: 320, height: 800, mobile: true },
  ]) {
    const record = { ...settings, passed: false };
    report.cases.push(record);
    const { context, page, fixture } = await makePage(settings);
    try {
      await page.goto(`${origin}/intake`);
      await activate(page.getByRole("button", { name: modes.personal }), settings.mobile);
      const request = page.getByRole("textbox", { name: /Investigation request/ });
      const select = page.getByRole("combobox", { name: "Requested result", exact: true });
      await request.fill(requestText);
      await until(async () => {
        const text = await page.getByRole("status").innerText();
        assert.match(text, /Dana Example/); assert.match(text, /Example Labs/); assert.match(text, /owner/);
        assert.equal(await select.inputValue(), "phone");
      }, "Request interpretation was incorrect");
      await select.selectOption("");
      await request.fill("תמצא טלפון של דנה דוגמה שהיא הבעלים של מעבדות דוגמה");
      await until(async () => {
        assert.match(await page.getByRole("status").innerText(), /דנה דוגמה/);
        assert.equal(await select.inputValue(), "");
      }, "The General override did not survive the Hebrew request");
      await request.fill(requestText.replace("phone", "email"));
      await openReview(page, settings.mobile);
      assert.equal(await select.inputValue(), "");
      assert.equal(await page.locator("#identity-review-title").innerText(), "Dana Example");
      assert.equal(await page.getByText("Free Quick Check completed", { exact: true }).count(), 0);
      assert.match(await page.locator('[aria-current="step"]').textContent(), /2/);
      record.layout = await verifyWidth(page, settings.width);
      await page.screenshot({ path: path.join(output, `${settings.name}-personal-review.jpg`), fullPage: true, type: "jpeg", quality: 85 });

      await activate(page.getByRole("button", { name: modes.website }), settings.mobile);
      await target(page).fill("business-a.example");
      await openReview(page, settings.mobile);
      await activate(page.getByRole("button", { name: "Save intake for later", exact: true }), settings.mobile);
      await until(async () => { assert.equal(fixture.intakes.length, 1); assert.ok(await page.getByText("Intake saved. Continue to payment when you are ready.").isVisible()); }, "The initial intake was not saved");
      const firstId = fixture.intakes[0].intakeId;
      await target(page).fill("qa.subject@gmail.com");
      assert.equal(await page.locator("#paid-intake-title").count(), 0);
      await openReview(page, settings.mobile);
      assert.equal(await page.locator("#identity-review-title").innerText(), "qa.subject@gmail.com");
      assert.equal(await page.getByText("Free Quick Check completed", { exact: true }).count(), 0);
      await verifyWidth(page, settings.width);
      await page.screenshot({ path: path.join(output, `${settings.name}-changed-target-review.jpg`), fullPage: true, type: "jpeg", quality: 85 });
      await activate(page.getByRole("button", { name: "Save investigation to continue", exact: true }), settings.mobile);
      await page.getByRole("heading", { name: "Fixture checkout reached", exact: true }).waitFor({ state: "visible" });
      assert.equal(fixture.intakes.length, 2);
      assert.equal(fixture.intakes[1].target, "qa.subject@gmail.com");
      assert.notEqual(fixture.intakes[1].intakeId, firstId);
      assert.deepEqual(fixture.intents, [fixture.intakes[1].intakeId]);

      await page.goto(`${origin}/intake`);
      await target(page).fill("business-late.example");
      fixture.previewGate = deferred(); fixture.previewStarted = false;
      await activate(start(page), settings.mobile);
      await until(async () => { assert.equal(fixture.previewStarted, true); }, "The delayed preview request did not start");
      await target(page).fill("current.subject@gmail.com");
      await openReview(page, settings.mobile);
      const lateResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/free-scan/providers");
      fixture.previewGate.resolve();
      await (await lateResponse).finished();
      await page.waitForTimeout(100);
      assert.equal(await page.locator("#identity-review-title").innerText(), "current.subject@gmail.com");
      assert.equal(await page.getByText("Free Quick Check completed", { exact: true }).count(), 0);
      assert.deepEqual(fixture.unexpected, []);
      assert.deepEqual(fixture.consoleErrors, []);
      record.passed = true;
      record.checks = ["English and Hebrew interpretation", "manual override", "personal review truthfulness", "no horizontal overflow", "touch or pointer controls", "new target uses new intake and checkout", "late preview isolation", "no unexpected requests or console errors"];
    } catch (error) {
      record.error = error.stack;
      await page.screenshot({ path: path.join(output, `${settings.name}-failure.jpg`), fullPage: true, type: "jpeg", quality: 85 }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  }
  report.passed = true;
  console.log("Desktop, 390px, and 320px intake browser journeys passed.");
} catch (error) {
  report.error = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "results.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, "server.log"), serverLog.join(""));
}

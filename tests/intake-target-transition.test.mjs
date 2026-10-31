import assert from "node:assert/strict";
import test from "node:test";
import { clientComponentDriver, elements, textOf } from "./helpers/client-component-driver.mjs";
import { getDictionary } from "../lib/i18n/index.ts";
import * as request from "../lib/identityRequest.ts";
import * as routing from "../lib/investigationRouting.ts";
import * as preview from "../lib/freeScanPreviewFlow.ts";
import * as checkout from "../lib/investigationCheckout.ts";
import { createIntake } from "../lib/workspace.ts";
import { BETA_PRODUCT } from "../lib/pricing.ts";

const t = getDictionary("en");
const session = { userId: "intake-transition-fixture", email: "buyer@example.com", name: "Buyer", startedAt: "2026-10-31T00:00:00Z" };
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

async function pageDriver(options = {}) {
  const persisted = [];
  const storage = new Map();
  const sessionStorage = { setItem: (key, value) => storage.set(key, value), getItem: (key) => storage.get(key) || null, removeItem: (key) => storage.delete(key) };
  const driver = await clientComponentDriver(new URL("../app/intake/page.tsx", import.meta.url), {
    modules: {
      "next/link": "Link", "next/image": "Image", "@/lib/brand": { CANONICAL_LOGO_PATH: "/logo.png" },
      "next/navigation": { useRouter: () => router },
      "../../components/PaymentButtons": "PaymentButtons",
      "../../components/investigation/JourneyProgress": "JourneyProgress",
      "../../components/quick-check/QuickCheckResult": "QuickCheckResult",
      "../../components/LocaleProvider": { useLocale: () => ({ t }) },
      "../../lib/auth": { getCurrentSession: () => session },
      "../../lib/workspace": { createIntake: async (actor, record) => {
        const intake = await createIntake(actor, record);
        persisted.push(intake);
        if (options.saveGate) await options.saveGate.promise;
        return intake;
      } },
      "../../lib/freeScanPreviewFlow": preview,
      "../../lib/pricing": { BETA_PRODUCT },
      "../../lib/investigationRouting": routing,
      "../../lib/identityRequest": request,
    },
    globals: {
      document: {}, sessionStorage,
      window: { sessionStorage, location: { search: "", assign() { throw new Error("Unexpected navigation"); } } },
      fetch: options.fetch || (async () => Response.json({ status: "ready", executedAt: "fixture", targetResolution: { requestedTarget: "business-a.example" } })),
    },
  });
  const router = { push() { throw new Error("Unexpected signup"); } };
  const render = () => driver.render();
  const find = (predicate) => {
    const result = elements(render()).find(predicate);
    assert.ok(result, "Expected component control is present");
    return result;
  };
  const button = (label) => find((node) => node.type === "button" && textOf(node).includes(label));
  const target = () => find((node) => node.type === "input" && node.props.placeholder === t.intakeUi.targetPlaceholder);
  const payment = () => find((node) => node.type === "PaymentButtons");
  const advance = async () => {
    await button(t.intakeUi.startInvestigation).props.onClick();
    button("Run Full Investigation").props.onClick();
    return payment();
  };
  return { render, find, button, target, payment, advance, persisted, storage };
}

for (const transition of ["target", "mode"]) test(`saved business to canonical personal checkout clears old references on ${transition} change`, async () => {
  const page = await pageDriver();
  page.target().props.onChange({ target: { value: "business-a.example" } });
  await page.advance();
  await page.button("Save intake for later").props.onClick();
  const savedId = page.payment().props.intakeId;
  assert.equal(savedId, page.persisted[0].intakeId);
  assert.equal(page.persisted[0].target, "business-a.example");
  page.storage.set("shadowscore.checkout-draft.v1", "old draft");

  if (transition === "mode") {
    page.button("Personal identity").props.onClick();
    const emailLabel = page.find((node) => node.type === "label" && textOf(node).includes("Person's email"));
    elements(emailLabel).find((node) => node.type === "input").props.onChange({ target: { value: "subject-b@gmail.com" } });
  } else page.target().props.onChange({ target: { value: "subject-b@gmail.com" } });

  const changed = page.render();
  assert.equal(elements(changed).some((node) => node.type === "PaymentButtons" || node.type === "QuickCheckResult"), false);
  assert.equal(page.storage.has("shadowscore.checkout-draft.v1"), false);
  assert.equal(page.storage.has("shadowscore_last_lead"), false);
  const current = await page.advance();
  assert.equal(current.props.intakeId, undefined);
  const checkoutIds = [];
  const result = await checkout.prepareInvestigationCheckout({
    email: session.email, authenticatedEmail: session.email, intakeId: current.props.intakeId,
    persistIntake: current.props.onPersistIntake,
    createIntent: async (intakeId) => { checkoutIds.push(intakeId); return { reportId: `report-${intakeId}` }; },
  });
  assert.notEqual(result.intakeId, savedId);
  assert.deepEqual(checkoutIds, [page.persisted[1].intakeId]);
  assert.equal(page.persisted[1].target, "subject-b@gmail.com");
  assert.equal(page.persisted[1].investigationRouting.primaryInvestigationType, "PERSON_IDENTITY");
});

test("explicit General identity overrides inferred phone and persists after editing the request", async () => {
  const page = await pageDriver();
  page.button("Personal identity").props.onClick();
  const requestInput = () => page.find((node) => node.type === "textarea");
  const selection = () => page.find((node) => node.type === "select");
  requestInput().props.onChange({ target: { value: "Find phone for Ariel Tuval who is owner at Atzmale" } });
  assert.equal(selection().props.value, "phone");
  selection().props.onChange({ target: { value: "" } });
  assert.equal(selection().props.value, "");
  requestInput().props.onChange({ target: { value: "Find email for Ariel Tuval who is owner at Atzmale" } });
  assert.equal(selection().props.value, "");
  await page.advance();
  await page.button("Save intake for later").props.onClick();
  assert.deepEqual(Array.from(page.persisted[0].identitySignals.requestedAttributes), []);
  assert.equal(page.persisted[0].identitySignals.names[0], "Ariel Tuval");
});

test("late preview and persistence responses cannot restore a previous target's checkout", async () => {
  const previewGate = deferred();
  const page = await pageDriver({ fetch: () => previewGate.promise });
  page.target().props.onChange({ target: { value: "business-a.example" } });
  const pendingPreview = page.button(t.intakeUi.startInvestigation).props.onClick();
  page.target().props.onChange({ target: { value: "subject-b@gmail.com" } });
  previewGate.resolve(Response.json({ status: "ready", targetResolution: { requestedTarget: "business-a.example" } }));
  await pendingPreview;
  assert.equal(elements(page.render()).some((node) => node.type === "QuickCheckResult"), false);

  const saveGate = deferred();
  const saving = await pageDriver({ saveGate });
  saving.target().props.onChange({ target: { value: "business-a.example" } });
  const oldPayment = await saving.advance();
  const checkoutIds = [];
  const pendingCheckout = checkout.prepareInvestigationCheckout({
    email: session.email, authenticatedEmail: session.email,
    persistIntake: oldPayment.props.onPersistIntake,
    createIntent: async (id) => { checkoutIds.push(id); return {}; },
  });
  saving.target().props.onChange({ target: { value: "subject-b@gmail.com" } });
  saveGate.resolve();
  await assert.rejects(pendingCheckout, /investigation changed/);
  assert.deepEqual(checkoutIds, []);
  assert.equal(elements(saving.render()).some((node) => node.type === "PaymentButtons"), false);
});

test("unmounting the previous payment control cancels late persistence and report navigation", async () => {
  for (const stage of ["persistence", "intent"]) {
    const gate = deferred();
    const intentIds = [];
    const navigations = [];
    const driver = await clientComponentDriver(new URL("../components/PaymentButtons.tsx", import.meta.url), {
      modules: {
        "../lib/auth": { getCurrentSession: () => session },
        "../lib/investigationCheckout": checkout,
      },
      globals: {
        window: { location: { assign: (url) => navigations.push(url) } },
        fetch: async (_url, options) => {
          intentIds.push(JSON.parse(options.body).intakeId);
          if (stage === "intent") await gate.promise;
          return Response.json({ intent: { reportId: "old-report" }, reportId: "old-report" });
        },
      },
    });
    const tree = driver.render({
      email: session.email, intakeId: stage === "intent" ? "old-intake" : undefined,
      onPersistIntake: async () => { await gate.promise; return "old-intake"; },
    });
    const pending = elements(tree).find((node) => node.type === "button").props.onClick();
    driver.unmount();
    gate.resolve();
    await pending;
    assert.deepEqual(intentIds, stage === "intent" ? ["old-intake"] : []);
    assert.deepEqual(navigations, []);
  }
});

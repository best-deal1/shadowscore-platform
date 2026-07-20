import assert from "node:assert/strict";
import { directionForLocale, getDictionary, locales, localizeReportText, publicPages } from "../lib/i18n/index.ts";

function assertCompleteDictionary(dictionary, canonical, path = "") {
  if (path === "legal.terms.sections" || path === "legal.privacy.sections") {
    assert.equal(dictionary.length, canonical.length, `${path} must retain every legal section`);
    for (const section of dictionary) {
      assert.equal(typeof section.title, "string", `${path} title must be a string`);
      assert.ok(Array.isArray(section.body) && section.body.every((value) => typeof value === "string"), `${path} body must contain strings`);
      if (section.items) assert.ok(section.items.every((value) => typeof value === "string"), `${path} items must contain strings`);
    }
    return;
  }
  assert.deepEqual(Object.keys(dictionary).sort(), Object.keys(canonical).sort(), `${path || "dictionary"} has a different key set`);
  for (const key of Object.keys(canonical)) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = dictionary[key];
    const reference = canonical[key];
    if (typeof reference === "object") assertCompleteDictionary(value, reference, currentPath);
    else assert.equal(typeof value, "string", `${currentPath} must be a string`);
  }
}

const english = getDictionary("en");
for (const locale of locales) {
  const dictionary = getDictionary(locale);
  assertCompleteDictionary(dictionary, english);
  assert.equal(directionForLocale(locale), ["he", "ar"].includes(locale) ? "rtl" : "ltr");
  if (locale !== "en") {
    for (const [key, value] of Object.entries(dictionary.intakeUi)) {
      assert.notEqual(value, english.intakeUi[key], `${locale}.intakeUi.${key} must be localized`);
    }
    for (const [key, value] of Object.entries(dictionary.report.content)) {
      assert.notEqual(value, english.report.content[key], `${locale}.report.content.${key} must be localized`);
    }
  }
}
for (const locale of locales) {
  const page = publicPages[locale];
  assert.equal(page.plans.unlocks.length, publicPages.en.plans.unlocks.length, `${locale}.plans.unlocks must retain every plan feature`);
  assert.ok(Object.values(page.about).every((value) => value.trim().length > 0), `${locale}.about must contain copy`);
  assert.ok(Object.values(page.plans).filter((value) => typeof value === "string").every((value) => value.trim().length > 0), `${locale}.plans must contain copy`);
}
for (const locale of ["ar", "es", "fr", "de"])
  assert.notDeepEqual(publicPages[locale], publicPages.he, `${locale} must not reuse Hebrew public-page translations`);
const canonical = { evidenceId: "ev-1", decision: "REVIEW", score: "needs_review", source: "rdap.org", observedAt: "2026-07-19T00:00:00Z" };
for (const locale of locales) assert.deepEqual(canonical, { ...canonical }, `${locale} changed canonical content`);

const reportItems = [
  "Acme Ltd is presented as small business associated with acme.example.",
  "Allowed: Request the company registration document.",
  "Blocked until verification: Send payment to account 1234.",
  "The main follow-up is to confirm the beneficial owner.",
  "Certificate issuer from TLS handshake",
];
for (const locale of locales.filter((locale) => locale !== "en")) {
  const localized = reportItems.map((item) => localizeReportText(item, locale));
  assert.equal(new Set(localized).size, reportItems.length, `${locale} must preserve each distinct report item`);
  assert.ok(localized.every((item) => item.trim().length > 0), `${locale} must not replace report content with placeholders`);
  assert.ok(localized.some((item, index) => item !== reportItems[index]), `${locale} must localize report prose`);
  assert.ok(localized[0].includes("Acme Ltd") && localized[0].includes("acme.example"), `${locale} must preserve report-specific facts`);
  assert.ok(localized[1].includes("company registration document") && localized[2].includes("account 1234"), `${locale} must preserve requested verification details`);
}
console.log(`Validated ${locales.length} complete locale dictionaries, RTL direction, canonical presentation boundaries, and semantic report item localization.`);

const userPages = (await import("../lib/i18n/index.ts")).userPageCopy;
for (const pageName of ["security", "contact", "login", "signup", "example"]) {
  assert.notDeepEqual(userPages.he[pageName], userPages.en[pageName], `Hebrew ${pageName} page copy must be localized`);
}
console.log("Validated localized Hebrew copy for every public account, contact, security, and example-report route.");

const { applicationCopy } = await import("../lib/i18n/index.ts");
const applicationEnglish = applicationCopy.en;
for (const locale of locales) {
  assertCompleteDictionary(applicationCopy[locale], applicationEnglish, `${locale}.applicationCopy`);
  if (locale !== "en") {
    for (const [sectionName, section] of Object.entries(applicationCopy[locale]))
      for (const [key, value] of Object.entries(section))
        assert.notEqual(value, applicationEnglish[sectionName][key], `${locale}.applicationCopy.${sectionName}.${key} must not fall back to English`);
  }
}
console.log("Validated localized workspace, monitoring, and account UI copy for every supported locale.");

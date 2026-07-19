import assert from "node:assert/strict";
import { directionForLocale, getDictionary, locales } from "../lib/i18n/index.ts";

function assertCompleteDictionary(dictionary, canonical, path = "") {
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
}
const canonical = { evidenceId: "ev-1", decision: "REVIEW", score: "needs_review", source: "rdap.org", observedAt: "2026-07-19T00:00:00Z" };
for (const locale of locales) assert.deepEqual(canonical, { ...canonical }, `${locale} changed canonical content`);
console.log(`Validated ${locales.length} complete locale dictionaries, RTL direction, and canonical presentation boundaries.`);

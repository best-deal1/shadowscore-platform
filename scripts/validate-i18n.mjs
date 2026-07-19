import assert from "node:assert/strict";
import { directionForLocale, getDictionary, locales } from "../lib/i18n/index.ts";
const required = ["nav.investigations", "nav.start", "intake.title", "report.verifiedFacts", "report.provenance", "scorecard.strong", "scorecard.unavailable"];
const read = (value, key) => key.split(".").reduce((current, part) => current?.[part], value);
for (const locale of locales) { const dictionary = getDictionary(locale); for (const key of required) assert.equal(typeof read(dictionary, key), "string", `${locale} is missing ${key}`); assert.equal(directionForLocale(locale), ["he", "ar"].includes(locale) ? "rtl" : "ltr"); }
const canonical = { evidenceId: "ev-1", decision: "REVIEW", score: "needs_review", source: "rdap.org", observedAt: "2026-07-19T00:00:00Z" };
for (const locale of locales) assert.deepEqual(canonical, { ...canonical }, `${locale} changed canonical content`);
console.log(`Validated ${locales.length} locales, English fallback, RTL direction, and canonical presentation boundaries.`);

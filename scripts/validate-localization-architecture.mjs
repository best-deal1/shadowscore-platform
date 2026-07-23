import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { getMarketingMessages, localizedDirections, localizedMarketingMetadata, localizedPath, supportedLocales } from "../lib/i18n/localization.ts";

const files = await readdir(new URL("../messages/", import.meta.url));
for (const locale of supportedLocales) {
  assert.ok(files.includes(`${locale}.json`), `Missing messages/${locale}.json`);
  const copy = getMarketingMessages(locale).marketing;
  assert.ok(Object.values(copy).every((value) => value.trim()), `${locale} contains an empty marketing translation`);
  assert.equal(localizedDirections[locale], ["he", "ar"].includes(locale) ? "rtl" : "ltr");
  const metadata = localizedMarketingMetadata(locale, "company-check");
  assert.equal(metadata.alternates?.canonical, localizedPath("/company-check", locale));
  assert.equal(metadata.alternates?.languages?.["x-default"], "/company-check");
  assert.equal(Object.keys(metadata.alternates?.languages ?? {}).filter((key) => key !== "x-default").length, supportedLocales.length);
}
assert.equal(localizedPath("/fr/company-check", "de"), "/de/company-check");
assert.equal(localizedPath("/company-check", "en"), "/company-check");
const sitemapSource = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
assert.match(sitemapSource, /localizedMarketingRoutes/);
assert.match(sitemapSource, /supportedLocales/);
console.log(`Validated ${supportedLocales.length} message files, routing, RTL, hreflang metadata, canonical URLs, and localized sitemap entries.`);

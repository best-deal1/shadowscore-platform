import assert from "node:assert/strict";
import test from "node:test";
import { resolveFirstPartyEntities, resolutionTarget } from "../lib/entityResolution/firstParty.ts";

test("email, URL, and domain remain separate target types", () => {
  assert.deepEqual(resolutionTarget("moshez@s-horowitz.com"), { originalInput: "moshez@s-horowitz.com", inputType: "email", domain: "s-horowitz.com" });
  assert.equal(resolutionTarget("s-horowitz.com").inputType, "domain");
  assert.equal(resolutionTarget("https://s-horowitz.com/people").inputType, "url");
});

test("bounded discovery resolves only evidence-backed first-party entities", async () => {
  const pages = new Map([
    ["https://s-horowitz.com/", '<meta property="og:site_name" content="S Horowitz"><a href="/people/moshe">People</a>'],
    ["https://s-horowitz.com/sitemap.xml", "<urlset><url><loc>https://s-horowitz.com/contact</loc></url></urlset>"],
    ["https://s-horowitz.com/people/moshe", "Moshe Ziv, Managing Partner. moshez@s-horowitz.com +972 3 567 0700"],
    ["https://s-horowitz.com/contact", "Contact S Horowitz"],
  ]);
  const result = await resolveFirstPartyEntities("moshez@s-horowitz.com", { fetch: async (url) => new Response(pages.get(String(url)) || "", { status: pages.has(String(url)) ? 200 : 404 }) });
  assert.equal(result.originalInput, "moshez@s-horowitz.com");
  assert.equal(result.resolvedDomain, "s-horowitz.com");
  assert.equal(result.discovery.totalUrlsFetched, 4);
  assert.ok(result.entities.some((item) => item.type === "Person" && item.value === "Moshe Ziv"));
  assert.ok(result.entities.some((item) => item.type === "Role" && item.value === "Managing Partner"));
  assert.ok(result.entities.some((item) => item.type === "Organization" && item.value === "S Horowitz"));
  assert.ok(result.relationships.every((item) => item.evidenceUrl.startsWith("https://s-horowitz.com/")));
});

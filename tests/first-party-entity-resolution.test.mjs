import assert from "node:assert/strict";
import test from "node:test";
import { isPublicIpAddress, resolveFirstPartyEntities, resolutionTarget } from "../lib/entityResolution/firstParty.ts";

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];

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
  const result = await resolveFirstPartyEntities("moshez@s-horowitz.com", { lookup: publicLookup, fetch: async (url) => new Response(pages.get(String(url)) || "", { status: pages.has(String(url)) ? 200 : 404 }) });
  assert.equal(result.originalInput, "moshez@s-horowitz.com");
  assert.equal(result.resolvedDomain, "s-horowitz.com");
  assert.equal(result.discovery.totalUrlsFetched, 4);
  assert.ok(result.entities.some((item) => item.type === "Person" && item.value === "Moshe Ziv"));
  assert.ok(result.entities.some((item) => item.type === "Role" && item.value === "Managing Partner"));
  assert.ok(result.entities.some((item) => item.type === "Organization" && item.value === "S Horowitz"));
  assert.ok(result.relationships.every((item) => item.evidenceUrl.startsWith("https://s-horowitz.com/")));
});

test("rejects loopback, private, reserved, and IPv6 local address classes", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.4", "169.254.169.254", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1"]) {
    assert.equal(isPublicIpAddress(address), false, address);
  }
  assert.equal(isPublicIpAddress("93.184.216.34"), true);
  assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
});

test("rejects hostnames resolving to loopback or RFC1918 addresses before fetch", async () => {
  for (const address of ["127.0.0.1", "10.0.0.8"]) {
    let requests = 0;
    const result = await resolveFirstPartyEntities("example.com", {
      lookup: async () => [{ address, family: 4 }],
      fetch: async () => { requests++; return new Response("unexpected"); },
      maxUrls: 2,
    });
    assert.equal(requests, 0);
    assert.equal(result.discovery.totalUrlsFetched, 0);
    assert.match(result.discovery.failures[0].reason, /non-public/);
  }
});

test("validates every redirect and blocks localhost and private IP destinations", async () => {
  for (const location of ["https://localhost/admin", "https://10.0.0.5/admin"]) {
    let requests = 0;
    const result = await resolveFirstPartyEntities("example.com", {
      lookup: publicLookup,
      fetch: async () => { requests++; return new Response(null, { status: 302, headers: { location } }); },
      maxUrls: 2,
    });
    assert.equal(requests, 2, "each discovery seed stops after its untrusted redirect response");
    assert.equal(result.discovery.totalUrlsFetched, 0);
    assert.match(result.discovery.failures[0].reason, /first-party|non-public/);
  }
});

test("allows a validated same-domain HTTPS redirect", async () => {
  const seen = [];
  const result = await resolveFirstPartyEntities("example.com", {
    lookup: publicLookup,
    fetch: async (url, init) => {
      seen.push([String(url), init.redirect]);
      if (String(url) === "https://example.com/") return new Response(null, { status: 302, headers: { location: "/home" } });
      return new Response("Public home");
    },
    maxUrls: 2,
  });
  assert.equal(result.discovery.homepageFetched, true);
  assert.deepEqual(seen.slice(0, 2), [["https://example.com/", "manual"], ["https://example.com/home", "manual"]]);
});

test("resolves Hebrew identity, role, organization, phone, and relationships from exact-email evidence", async () => {
  const evidenceUrl = "https://example.co.il/";
  const html = '<meta property="og:site_name" content="משרד כהן">משה כהן, שותף מנהל. moshe@example.co.il. טלפון מקצועי +972 3 555 1212';
  const result = await resolveFirstPartyEntities("moshe@example.co.il", {
    lookup: publicLookup,
    fetch: async (url) => new Response(String(url) === evidenceUrl ? html : "", { status: String(url) === evidenceUrl ? 200 : 404 }),
  });
  for (const [type, value] of [["Email", "moshe@example.co.il"], ["Person", "משה כהן"], ["Role", "שותף מנהל"], ["Organization", "משרד כהן"], ["Phone", "+972 3 555 1212"]]) {
    const entity = result.entities.find((item) => item.type === type && item.value === value);
    assert.deepEqual(entity?.evidenceUrls, [evidenceUrl], `${type}: ${value}`);
  }
  assert.ok(result.relationships.some((item) => item.from === "משה כהן" && item.type === "works at" && item.to === "משרד כהן" && item.evidenceUrl === evidenceUrl));
  assert.ok(result.relationships.some((item) => item.from === "משה כהן" && item.type === "uses phone" && item.evidenceUrl === evidenceUrl));
  assert.ok(result.relationships.some((item) => item.from === "משה כהן" && item.type === "uses email" && item.to === "moshe@example.co.il"));
});

test("does not invent a person from an email local-part without a nearby named role", async () => {
  const result = await resolveFirstPartyEntities("moshe.cohen@example.com", {
    lookup: publicLookup,
    fetch: async (url) => new Response(String(url).endsWith("sitemap.xml") ? "" : "Contact: moshe.cohen@example.com"),
  });
  assert.ok(result.entities.some((item) => item.type === "Email"));
  assert.equal(result.entities.some((item) => item.type === "Person"), false);
});

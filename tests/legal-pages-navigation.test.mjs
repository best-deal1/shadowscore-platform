import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readPage = (name) => readFile(new URL(`../app/${name}/page.tsx`, import.meta.url), "utf8");

test("legal pages provide responsive, anchored document navigation", async () => {
  for (const name of ["terms", "privacy"]) {
    const source = await readPage(name);

    assert.match(source, /<nav aria-label=/);
    assert.match(source, /id={`section-\$\{index \+ 1\}`}/);
    assert.match(source, /href={`#section-\$\{index \+ 1\}`}/);
    assert.match(source, /lg:sticky lg:top-24/);
    assert.match(source, /<ul className=/);
    assert.match(source, /<li key={item}/);
  }
});

test("legal pages expose contact and related-policy routes", async () => {
  const [terms, privacy] = await Promise.all([readPage("terms"), readPage("privacy")]);

  assert.match(terms, /href="\/privacy"/);
  assert.match(terms, /mailto:\$\{CONTACT_EMAIL\}/);
  assert.match(privacy, /href="\/terms"/);
  assert.match(privacy, /mailto:\$\{PRIVACY_EMAIL\}/);
});

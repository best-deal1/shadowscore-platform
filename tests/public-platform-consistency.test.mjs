import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Platform and About use the shared public shell and complete primary journeys", async () => {
  const [platform, about] = await Promise.all([
    read("app/business-due-diligence/page.tsx"),
    read("app/about/page.tsx"),
  ]);

  for (const source of [platform, about]) {
    assert.match(source, /<ShadowScoreLayout>/);
    assert.match(source, /href="\/sample-report"/);
    assert.match(source, /export const metadata/);
  }

  assert.match(platform, /href="\/intake"/);
  assert.match(platform, /href="\/pricing"/);
  assert.match(platform, /Coverage depends on/);
  assert.match(about, /href="\/business-due-diligence"/);
  assert.match(about, /href="\/contact"/);
  assert.match(about, /Independent decision support/);
});

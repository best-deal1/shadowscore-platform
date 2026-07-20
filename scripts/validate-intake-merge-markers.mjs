import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const intakePage = new URL("../app/intake/page.tsx", import.meta.url);
const source = await readFile(intakePage, "utf8");
const markerPattern = /^(?:<<<<<<<|=======|>>>>>>>).*$/m;

assert.equal(
  markerPattern.test(source),
  false,
  "app/intake/page.tsx contains an unresolved Git merge-conflict marker.",
);

console.log("Intake page contains no unresolved Git merge-conflict markers.");

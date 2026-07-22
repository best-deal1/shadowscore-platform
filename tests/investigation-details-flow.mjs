import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const port = 3111;
const baseUrl = `http://127.0.0.1:${port}`;
const targets = ["Integration Route Test Ltd.", "Second Scoped Route Test Ltd."];
const server = spawn("npm", ["run", "dev", "--", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/investigations`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not start.\n${output}`);
}

try {
  await waitForServer();
  const investigations = [];
  for (const target of targets) {
    const create = await fetch(`${baseUrl}/api/investigations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) });
    assert.equal(create.status, 201);
    const investigation = await create.json();
    for (let stage = 0; stage < 4; stage += 1) {
      const advance = await fetch(`${baseUrl}/api/investigations/${investigation.investigationId}`, { method: "POST" });
      assert.equal(advance.status, 200);
    }
    investigations.push(investigation);
  }

  for (const [index, investigation] of investigations.entries()) {
    const detailsPath = `/investigations/${investigation.investigationId}`;
    const details = await (await fetch(`${baseUrl}${detailsPath}`)).text();
    assert.match(details, /Investigation Details/);
    assert.match(details, new RegExp(targets[index]));
    assert.doesNotMatch(details, new RegExp(targets[1 - index]));
    assert.doesNotMatch(details, /Northstar Marketplace Ltd\.|Elena Volkov|Orion Goods|restricted seller/i);
  }

  const missing = await (await fetch(`${baseUrl}/investigations/inv-missing`)).text();
  assert.match(missing, /Investigation not found/);
} finally {
  server.kill("SIGTERM");
  await once(server, "exit");
}

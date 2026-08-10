import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const port = 3111;
const baseUrl = `http://127.0.0.1:${port}`;
const target = "Integration Route Test Ltd.";
const server = spawn("npm", ["run", "dev", "--", "--port", String(port)], { detached: true, stdio: ["ignore", "pipe", "pipe"] });
const serverExit = once(server, "exit");
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
  const create = await fetch(`${baseUrl}/api/investigations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) });
  assert.equal(create.status, 401);
  assert.deepEqual(await create.json(), { error: "Authentication is required." });

  const details = await fetch(`${baseUrl}/investigations/inv-private`, { redirect: "manual" });
  assert.ok([302, 303, 307, 308].includes(details.status));
  assert.match(details.headers.get("location") || "", /^\/login\?returnTo=/);
} finally {
  process.kill(-server.pid, "SIGTERM");
  await serverExit;
}

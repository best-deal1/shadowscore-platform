import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const clientFiles = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".next" || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:ts|tsx)$/.test(entry.name) && readFileSync(path, "utf8").startsWith('"use client"')) clientFiles.push(path);
  }
}
walk(join(root, "app"));
walk(join(root, "components"));

const forbidden = ["lib/reportPipeline", "lib/workspace.server", "lib/admin", "lib/providers/ProviderManager", "lib/providers/defaultProviders", "lib/providers/BaseProvider", "node:dns"];
for (const path of clientFiles) {
  const source = readFileSync(path, "utf8");
  for (const boundary of forbidden) {
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.ok(!new RegExp(`from\\s+["'][^"']*${escaped}["']`).test(source), `${relative(root, path)} imports server-only boundary ${boundary}`);
  }
}
console.log(`Public browser boundary validated across ${clientFiles.length} Client Components.`);

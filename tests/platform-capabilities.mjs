import assert from "node:assert/strict";
import {
  getPlatformCapability,
  getPlatformCapabilityCatalog,
  TRUST_INTELLIGENCE_PLATFORM_VERSION,
} from "../lib/platform/registry.ts";

const catalog = getPlatformCapabilityCatalog();

assert.equal(catalog.version, TRUST_INTELLIGENCE_PLATFORM_VERSION);
assert.equal(catalog.capabilities.length, 8);
assert.deepEqual(
  catalog.capabilities.map((capability) => capability.id),
  ["identity", "evidence", "trust", "risk", "monitoring", "decision", "intelligence", "relationship_graph"],
);
assert.ok(catalog.capabilities.every((capability) => capability.consumers.includes("workspace")));
assert.ok(getPlatformCapability("decision")?.outputs.includes("recommended action"));
assert.equal(getPlatformCapability("identity")?.implementation, "lib/identity");

console.log("Platform capability catalog validation passed.");

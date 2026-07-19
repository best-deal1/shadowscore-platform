import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const outDir = join(tmpdir(), "shadowscore-reasoning-boundary-validation");
const tscPath = require.resolve("typescript/bin/tsc");

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

try {
  execFileSync(process.execPath, [tscPath, "scripts/validate-reasoning-boundary.ts", "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node", "--noEmit", "false"], { stdio: "inherit" });
  require(join(outDir, "scripts", "validate-reasoning-boundary.js"));
} finally {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
}

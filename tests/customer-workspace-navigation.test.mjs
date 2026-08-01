import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authenticated customer routes share the workspace shell", async () => {
  for (const route of ["app/workspace/layout.tsx", "app/investigations/layout.tsx", "app/reports/layout.tsx", "app/archive/layout.tsx", "app/admin/layout.tsx"]) {
    assert.match(await read(route), /AuthenticatedLayout/);
  }
});

test("workspace navigation is canonical, current, and actionable", async () => {
  const shell = await read("components/workspace/WorkspaceShell.tsx");
  assert.match(shell, /href: "\/workspace"/);
  assert.match(shell, /href: "\/reports"/);
  assert.match(shell, /href: "\/archive"/);
  assert.match(shell, /aria-current=\{current \? "page"/);
  assert.match(shell, /href="\/admin"/);
  assert.match(shell, /logoutUser/);
});

test("duplicate investigation routes resolve to canonical workspace routes", async () => {
  assert.match(await read("app/investigations/page.tsx"), /redirect\("\/workspace"\)/);
  assert.match(await read("app/investigations/\[investigationId\]/page.tsx"), /redirect\(`\/cases\//);
});

test("workspace destinations define loading and error states", async () => {
  for (const route of ["workspace", "reports", "archive"]) {
    assert.match(await read(`app/${route}/loading.tsx`), /aria-busy="true"/);
    assert.match(await read(`app/${route}/error.tsx`), /role="alert"/);
  }
});

test("public mobile navigation does not duplicate Security", async () => {
  const layout = await read("components/ShadowScoreLayout.tsx");
  const mobileNav = layout.slice(layout.indexOf("const mobilePublicNav"), layout.indexOf("const socialLinks"));
  assert.doesNotMatch(mobileNav, /\/security/);
});

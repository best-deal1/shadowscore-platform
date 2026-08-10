import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authenticated customer routes share the workspace shell", async () => {
  for (const route of ["app/workspace/layout.tsx", "app/investigations/layout.tsx", "app/reports/layout.tsx", "app/archive/layout.tsx", "app/admin/layout.tsx"]) {
    assert.match(await read(route), /AuthenticatedLayout/);
  }
});

test("authenticated customers leave login through the workspace proxy", async () => {
  const proxy = await read("proxy.ts");
  assert.match(proxy, /request\.nextUrl\.pathname === "\/login"/);
  assert.match(proxy, /NextResponse\.redirect\(new URL\("\/workspace", request\.url\)\)/);
  assert.match(proxy, /"\/login",/);
});

test("authenticated customers receive an active workspace membership", async () => {
  const migration = await read("supabase/migrations/20260802000000_provision_workspace_membership.sql");
  assert.match(migration, /insert into public\.profiles/);
  assert.match(migration, /insert into public\.organizations/);
  assert.match(migration, /insert into public\.organization_memberships/);
  assert.match(migration, /after insert or update of email, raw_user_meta_data on auth\.users/);
  assert.match(migration, /for existing_user in select \* from auth\.users/);
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

test("the investigation index resolves to the workspace and details retain canonical identity", async () => {
  assert.match(await read("app/investigations/page.tsx"), /redirect\("\/workspace"\)/);
  const details = await read("app/investigations/[investigationId]/page.tsx");
  assert.match(details, /repository\.get\(investigationId\)/);
  assert.doesNotMatch(details, /redirect\(`\/cases\//);
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

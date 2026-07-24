import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../app/cases/_components/CaseDetailsWorkspace.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/cases/[caseId]/page.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../lib/workspace/timelineRepository.ts", import.meta.url), "utf8");

for (const label of ["Owner", "Due date", "Last updated", "Case reference", "Investigation type"]) assert.match(component, new RegExp(`text\\(\\"${label}`));
for (const label of ["Overview", "Timeline", "Evidence", "Findings", "Decision", "Report"]) assert.match(component, new RegExp(`label: \\"${label}\\"`));
assert.match(component, /role="tablist"/);
assert.match(component, /onKeyDown=\{\(event\) => moveTab/);
assert.match(component, /aria-selected=\{tab === item\.id\}/);
assert.match(component, /category: nextCategory/);
assert.match(component, /setCursor\(page\.nextCursor\)/);
assert.match(component, /Load more/);
assert.match(component, /isLoadingMore/);
assert.match(component, /aria-expanded=\{expanded === event\.id\}/);
assert.match(component, /role="status"/);
assert.match(component, /role="alert"/);
assert.match(component, /No activity recorded/);
assert.match(route, /categoryFilters/);
assert.match(route, /event_type\.like\.evidence/);
assert.match(page, /requireWorkspaceActor/);
assert.match(page, /getWorkspaceCase/);
console.log("case details UI tests passed");

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../app/cases/_components/CaseDetailsWorkspace.tsx", import.meta.url), "utf8");
const copy = await readFile(new URL("../lib/workspace/caseDetailsCopy.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/cases/[caseId]/page.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../lib/workspace/timelineRepository.ts", import.meta.url), "utf8");

for (const label of ["Owner", "Due date", "Last updated", "Case reference", "Investigation type"]) assert.match(copy, new RegExp(`: \\"${label}\\"`));
for (const label of ["Overview", "Timeline", "Evidence", "Findings", "Decision", "Report"]) assert.match(copy, new RegExp(`: \\"${label}\\"`));
assert.match(component, /caseDetailsCopy\[locale\]/);
assert.doesNotMatch(component, /const text = \(value: string\) => value/);
assert.match(component, /role="tablist"/);
assert.match(component, /onKeyDown=\{\(event\) => moveTab/);
assert.match(component, /aria-selected=\{tab === item\}/);
assert.match(component, /category: nextCategory/);
assert.match(component, /setCursor\(page\.nextCursor\)/);
assert.match(copy, /Load older activity/);
assert.match(component, /aria-expanded=\{expanded === event\.id\}/);
assert.match(component, /role="status"/);
assert.match(component, /role="alert"/);
assert.match(copy, /No activity recorded/);
assert.match(route, /categoryFilters/);
assert.match(route, /event_type\.like\.evidence/);
assert.match(page, /requireWorkspaceActor/);
assert.match(page, /getWorkspaceCase/);
console.log("case details UI tests passed");

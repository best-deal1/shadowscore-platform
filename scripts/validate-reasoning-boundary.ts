import { presentWorkspaceForEndUser, type WorkspaceData } from "../lib/workspace";
import { buildReasoning } from "../lib/reasoning";
import type { EvidenceItem } from "../lib/evidence";

const evidence: EvidenceItem = {
  id: "registry-name",
  provider: "registry",
  category: "Verified",
  status: "observed",
  source: "registry",
  confidence: 90,
  title: "Business name",
  description: "Business name is registered.",
  businessImpact: "Supports identity verification.",
  evidenceRefs: [{ id: "registry-name", type: "observation", label: "Business name", value: "Example LLC", source: "registry" }],
};

const workspace: WorkspaceData = {
  reports: [{
    reportId: "report-1",
    title: "Trust report",
    entity: "Example LLC",
    platform: "website",
    stage: "Healthy",
    createdAt: "2026-07-19T00:00:00.000Z",
    reportStatus: "ready",
    source: "test",
    topFactors: [],
    reportSummary: { message: "Report ready.", reasoning: buildReasoning({ evidenceItems: [evidence] }) },
  }],
  intakes: [],
  entities: [],
  acceptances: [],
  paymentIntents: [],
};

const presented = presentWorkspaceForEndUser(workspace);
if (presented.reports[0].reportSummary?.reasoning) {
  throw new Error("Internal reasoning output was included in the end-user workspace response.");
}
if (presented.reports[0].providerResults) {
  throw new Error("Raw provider results were included in the end-user workspace response.");
}
if (presented.reports[0].reportSummary?.knowledgeGraph || presented.reports[0].reportSummary?.technicalDetails) {
  throw new Error("Internal report implementation details were included in the end-user workspace response.");
}
if (!workspace.reports[0].reportSummary?.reasoning) {
  throw new Error("Presenting the workspace mutated the stored reasoning output.");
}

console.log("Reasoning boundary validation passed.");

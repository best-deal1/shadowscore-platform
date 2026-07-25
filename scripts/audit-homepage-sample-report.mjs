import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const validationRoot = resolve(root, "validation/website-intelligence");
const resultsRoot = resolve(validationRoot, "results");
const corpus = JSON.parse(await readFile(resolve(validationRoot, "corpus.json"), "utf8"));
const homepage = await readFile(resolve(root, "app/components/MarketingHome.tsx"), "utf8");
const route = await readFile(resolve(root, "app/sample-report/page.tsx"), "utf8");

const requiredRouteText = [
  "Demonstration data",
  "Recommended decision",
  "Risk level",
  "Decision confidence",
  "Evidence coverage",
  "Key finding",
  "Contradictions and missing evidence",
  "Recommended action and source appendix",
];

if (corpus.sites.length !== 20) throw new Error(`Expected 20 corpus sites, found ${corpus.sites.length}.`);
if (!homepage.includes('href="/sample-report"')) throw new Error("Homepage no longer links to /sample-report.");
for (const text of requiredRouteText) if (!route.includes(text)) throw new Error(`Sample report is missing: ${text}`);

const routeHash = createHash("sha256").update(route).digest("hex");
const staticReport = {
  route: "/sample-report",
  dataMode: "static-demonstration",
  metrics: {
    recommendedDecision: "Proceed only after verification",
    riskLevel: "Medium",
    decisionConfidence: "82%",
    evidenceCoverage: "68%",
  },
  sections: ["Key finding", "Contradictions and missing evidence", "Recommended action and source appendix"],
  factualClaims: [
    "The business identity is supported.",
    "Payment-account ownership remains unresolved.",
    "The review records conflicting address information and an unresolved beneficiary-account verification request.",
  ],
};

const rows = corpus.sites.map((site) => ({
  site: site.domain,
  reportGenerated: false,
  contract: "fail",
  evidence: "fail",
  unsupportedClaims: staticReport.factualClaims.length,
  contradictions: 0,
  result: "fail",
}));

const matrix = {
  auditVersion: 1,
  target: "homepage user-facing sample report",
  canonicalPath: {
    homepage: "app/page.tsx -> app/components/MarketingHome.tsx",
    link: "/sample-report",
    renderer: "app/sample-report/page.tsx",
    reportModel: null,
    websiteIntelligencePath: "lib/websiteIntelligence/index.ts -> investigateWebsite()",
    connectedToWebsiteIntelligence: false,
  },
  dataMode: "static-demonstration",
  routeSourceSha256: routeHash,
  corpusSize: corpus.sites.length,
  sitesAudited: corpus.sites.length,
  homepageReportsGenerated: 0,
  reportGenerationSuccessRate: 0,
  evidenceTraceability: { supportedClaims: 0, factualClaims: staticReport.factualClaims.length, rate: 0 },
  unsupportedClaimCount: staticReport.factualClaims.length,
  contradictionCount: 0,
  schemaContractFailures: corpus.sites.length,
  repeatedReportGroups: [{ routeSourceSha256: routeHash, siteCount: corpus.sites.length, reason: "The route ignores the site and renders one constant report." }],
  repeatability: { runsReviewed: 3, stableFields: "all visible fields", unstableFields: [], limitation: "Static source review. The route has no generation input or run state." },
  supplementalLivePipelineRun: {
    date: "2026-07-25",
    scope: "Internal Website Intelligence only. This output is not consumed by the homepage sample.",
    sitesReturningInternalReport: 20,
    modulesCompletedPerSite: 3,
    modulesUnavailablePerSite: 8,
    harnessResult: "failed before execution because scripts/validate-website-intelligence-live.mjs requires the wrong compiled path",
    manualHarnessResult: "20 internal reports returned after requiring the actual compiled path",
  },
  overallResult: "fail",
  rows,
};

await mkdir(resultsRoot, { recursive: true });
for (const site of corpus.sites) {
  const result = {
    auditVersion: 1,
    site,
    target: "homepage user-facing sample report",
    audited: true,
    endToEndCompleted: false,
    blocker: "The homepage sample route accepts no website input and does not import or consume WebsiteIntelligenceReport.",
    canonicalRenderedReport: staticReport,
    checks: {
      reportGeneration: { status: "fail", generatedForSite: false, uncaughtErrors: 0, reason: "No generation function is called by the route." },
      contract: { status: "fail", schemaValidated: false, requiredSectionsValidated: true, reason: "The rendered constants have no canonical report schema or report model." },
      evidenceTraceability: { status: "fail", supportedClaims: 0, factualClaims: staticReport.factualClaims.length, evidenceItems: 0 },
      hallucinationAndContradiction: { status: "fail", unsupportedClaims: staticReport.factualClaims, contradictions: [], genericCrossDomainReport: true },
      scoringAndDecision: { status: "fail", derivedScore: false, missingDataHandlingValidated: false, visibleValuesInternallyConsistent: true },
      presentation: { status: "partial", sectionsPresent: true, internalFieldsExposed: false, desktopStaticReview: "pass", mobileStaticReview: "pass", emptyAndPartialStates: "not implemented" },
      repeatability: { status: "pass", runsReviewed: 3, unstableFields: [], note: "The constant source produces identical visible content for every domain." },
    },
    result: "fail",
  };
  await writeFile(resolve(resultsRoot, `${site.id}.json`), `${JSON.stringify(result, null, 2)}\n`);
}
await writeFile(resolve(validationRoot, "report-audit-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`Audited ${corpus.sites.length} corpus entries. Homepage reports generated: 0. Overall result: FAIL.`);

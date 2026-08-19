import type {
  EngineDefinition,
  EnginePlanStep,
  ExecutionPlan,
  OrchestratorEngineId,
  SkippedEngine,
  TargetClassificationInput,
} from "./types";

const ENGINE_DEFINITIONS: Record<OrchestratorEngineId, EngineDefinition> = {
  dns: {
    engineId: "dns",
    label: "DNS",
    supportedTargets: ["Website", "Business", "Company", "Brand", "Business Profile", "Evidence Package"],
  },
  whois: {
    engineId: "whois",
    label: "WHOIS",
    supportedTargets: ["Website", "Business", "Company", "Brand", "Business Profile", "Evidence Package"],
  },
  ssl: {
    engineId: "ssl",
    label: "SSL",
    supportedTargets: ["Website", "Business", "Company", "Brand", "Business Profile", "Evidence Package"],
  },
  headers: { engineId: "headers", label: "Headers", supportedTargets: ["Website", "Evidence Package"] },
  "business-profile": {
    engineId: "business-profile",
    label: "Business Profile",
    supportedTargets: ["Website", "Business", "Marketplace Seller", "Marketplace Store", "Company", "Brand", "Business Profile", "Evidence Package"],
  },
  marketplace: { engineId: "marketplace", label: "Marketplace Engine", supportedTargets: ["Marketplace Seller", "Marketplace Store"] },
  reputation: { engineId: "reputation", label: "Reputation", supportedTargets: ["Marketplace Seller", "Marketplace Store", "Business", "Company", "Brand", "Business Profile"] },
  graph: { engineId: "graph", label: "Graph", supportedTargets: ["Marketplace Seller", "Marketplace Store", "Business", "Company", "Brand", "Business Profile", "Evidence Package"] },
  "email-intelligence": { engineId: "email-intelligence", label: "Email Intelligence", supportedTargets: ["Email"] },
  "external-identity": { engineId: "external-identity", label: "External Identity Discovery", supportedTargets: ["Email"] },
  domain: { engineId: "domain", label: "Domain", supportedTargets: ["Email"] },
  "evidence-parser": { engineId: "evidence-parser", label: "Evidence Parser", supportedTargets: ["Evidence Package"] },
  "contradiction-engine": { engineId: "contradiction-engine", label: "Contradiction Engine", supportedTargets: ["Evidence Package"] },
};

const TARGET_ENGINE_MATRIX: Record<TargetClassificationInput["targetType"], OrchestratorEngineId[]> = {
  Website: ["dns", "whois", "ssl", "headers", "business-profile"],
  Business: ["business-profile", "reputation", "graph"],
  "Marketplace Seller": ["marketplace", "business-profile", "reputation", "graph"],
  "Marketplace Store": ["marketplace", "business-profile", "reputation", "graph"],
  Company: ["business-profile", "reputation", "graph"],
  Brand: ["business-profile", "reputation", "graph"],
  "Business Profile": ["business-profile", "reputation", "graph"],
  Email: ["external-identity", "email-intelligence"],
  Phone: ["business-profile", "reputation"],
  "Evidence Package": ["evidence-parser", "contradiction-engine", "graph"],
  Unknown: [],
};

function planIdFor(classification: TargetClassificationInput, engineIds: OrchestratorEngineId[]): string {
  const target = classification.normalizedTarget || "unknown";
  return `${classification.targetType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${engineIds.join("-")}`;
}

function coverageFor(engineCount: number): ExecutionPlan["estimatedCoverage"] {
  if (engineCount === 0) return "limited";
  if (engineCount >= 5) return "comprehensive";
  if (engineCount >= 3) return "strong";
  return "partial";
}

function reasonForEngine(engineId: OrchestratorEngineId, classification: TargetClassificationInput): string {
  switch (engineId) {
    case "dns": return "Domain infrastructure is relevant for website and domain-derived targets.";
    case "whois": return "Registration context can support ownership, age, and continuity checks.";
    case "ssl": return "Certificate metadata helps validate the public web endpoint.";
    case "headers": return "HTTP headers provide observable website configuration signals.";
    case "business-profile": return "Business profile evidence normalizes organization-level identity signals.";
    case "marketplace": return `Marketplace-specific checks apply because the target was classified as ${classification.targetType}.`;
    case "reputation": return "Reputation signals are useful for public-facing commercial targets.";
    case "graph": return "Graph analysis links entities, identifiers, and evidence relationships.";
    case "email-intelligence": return "Email intelligence applies to a directly classified email address.";
    case "external-identity": return "Public web discovery searches for evidence-backed profiles and identity candidates associated with the submitted email.";
    case "domain": return "The email domain can be extracted and evaluated without contacting external APIs.";
    case "evidence-parser": return "Evidence packages must be parsed before downstream checks can compare claims.";
    case "contradiction-engine": return "Contradiction checks compare parsed evidence for inconsistent claims.";
  }
}

export function createExecutionPlan(classification: TargetClassificationInput): ExecutionPlan {
  const engineIds = TARGET_ENGINE_MATRIX[classification.targetType] ?? [];
  const selected = new Set(engineIds);
  const executionPlan: EnginePlanStep[] = engineIds.map((engineId, index) => ({
    engineId,
    label: ENGINE_DEFINITIONS[engineId].label,
    order: index + 1,
    required: index === 0 || ["dns", "marketplace", "email-intelligence", "external-identity", "evidence-parser", "business-profile"].includes(engineId),
    reason: reasonForEngine(engineId, classification),
  }));

  const skippedEngines: SkippedEngine[] = Object.values(ENGINE_DEFINITIONS)
    .filter((engine) => !selected.has(engine.engineId))
    .map((engine) => ({
      engineId: engine.engineId,
      label: engine.label,
      reason: engine.supportedTargets.includes(classification.targetType)
        ? "Engine is supported for this target type but not part of the default deterministic path."
        : `Engine does not match classified target type ${classification.targetType}.`,
    }));

  const reasoning = [
    `Target classified as ${classification.targetType} with ${Math.round(classification.confidence * 100)}% confidence.`,
    classification.reasoning,
    engineIds.length > 0 ? `Selected ${engineIds.length} deterministic engine(s) for this target type.` : "No deterministic engine path is available for this target type.",
  ];

  if (classification.detectedPlatform) reasoning.push(`Detected platform ${classification.detectedPlatform} influenced marketplace-aware planning.`);

  return {
    planId: planIdFor(classification, engineIds),
    targetType: classification.targetType,
    target: classification.normalizedTarget,
    detectedPlatform: classification.detectedPlatform,
    executionPlan,
    skippedEngines,
    reasoning,
    estimatedCoverage: coverageFor(executionPlan.length),
  };
}

export { ENGINE_DEFINITIONS, TARGET_ENGINE_MATRIX };

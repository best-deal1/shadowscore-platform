import type {
  PlatformCapability,
  PlatformCapabilityCatalog,
  PlatformCapabilityId,
} from "./types";

export const TRUST_INTELLIGENCE_PLATFORM_VERSION = "trust-intelligence-platform-v1";

const capabilities = [
  {
    id: "identity",
    name: "Identity Engine",
    description: "Resolves the business identity and the evidence behind it.",
    outputs: ["canonical identity", "identity confidence", "provenance"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/identity",
  },
  {
    id: "evidence",
    name: "Evidence Engine",
    description: "Normalizes source observations into traceable evidence.",
    outputs: ["evidence items", "coverage summary", "source reliability"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/evidence",
  },
  {
    id: "trust",
    name: "Trust Engine",
    description: "Builds an evidence-backed view of business trust.",
    outputs: ["trust insights", "trust timeline", "trust signals"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/insightEngine.ts",
  },
  {
    id: "risk",
    name: "Risk Engine",
    description: "Evaluates risk indicators and their business impact.",
    outputs: ["risk score", "risk domains", "risk reasons"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/riskEngine.ts",
  },
  {
    id: "monitoring",
    name: "Monitoring Engine",
    description: "Detects material changes across tracked business signals.",
    outputs: ["snapshots", "changes", "alerts"],
    consumers: ["command_center", "workspace", "partner_api"],
    implementation: "lib/monitoringEngine",
  },
  {
    id: "decision",
    name: "Decision Engine",
    description: "Produces an explainable recommendation from approved evidence.",
    outputs: ["decision", "confidence", "recommended action"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/decisionEngine",
  },
  {
    id: "intelligence",
    name: "Intelligence Engine",
    description: "Combines provider and business findings into decision context.",
    outputs: ["business findings", "narrative", "intelligence summary"],
    consumers: ["command_center", "workspace", "partner_api"],
    implementation: "lib/businessIntelligence",
  },
  {
    id: "relationship_graph",
    name: "Relationship Graph",
    description: "Connects businesses, identities, and evidence relationships over time.",
    outputs: ["entities", "relationships", "graph summary"],
    consumers: ["command_center", "workspace", "public_api", "partner_api"],
    implementation: "lib/knowledgeGraph",
  },
] as const satisfies readonly PlatformCapability[];

export function getPlatformCapabilityCatalog(): PlatformCapabilityCatalog {
  return {
    version: TRUST_INTELLIGENCE_PLATFORM_VERSION,
    capabilities,
  };
}

export function getPlatformCapability(id: PlatformCapabilityId) {
  return capabilities.find((capability) => capability.id === id);
}

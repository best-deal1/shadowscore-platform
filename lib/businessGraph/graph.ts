import type { BusinessProfile, BusinessProfileEvidenceItem, EvidenceReliability } from "../businessProfileEngine/types";
import { relationshipForNode, relationshipReason } from "./relationships";
import type { BusinessGraph, BusinessGraphEvidence, BusinessGraphInput, BusinessGraphNode, BusinessGraphNodeType } from "./types";

export const BUSINESS_GRAPH_ENGINE_VERSION = "business-graph-v43";

const LOWEST_RELIABILITY: EvidenceReliability = "Low";

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function normalizeValue(type: BusinessGraphNodeType, value: string) {
  const trimmed = value.trim();
  if (type === "Email" || type === "Domain") return trimmed.toLowerCase();
  if (type === "Phone") return trimmed.replace(/[^+0-9]/g, "");
  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

function evidenceFromProfile(profile: BusinessProfile, item?: BusinessProfileEvidenceItem): BusinessGraphEvidence {
  if (item) {
    return { id: item.id, label: item.label, value: item.value, source: item.source };
  }
  return { id: `${slug(profile.businessName)}:profile`, label: "Business profile", value: profile.businessName, source: "business-profile-engine" };
}

function nodeTypeForEvidence(item: BusinessProfileEvidenceItem): BusinessGraphNodeType | undefined {
  const text = `${item.type} ${item.label} ${item.value}`.toLowerCase();
  if (text.includes("email") || /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(item.value)) return "Email";
  if (text.includes("phone") || text.includes("telephone")) return "Phone";
  if (text.includes("address") || text.includes("street")) return "Address";
  if (item.type === "marketplace_verification" || text.includes("marketplace") || text.includes("seller") || text.includes("store")) return "Marketplace";
  if (item.type === "government_registry" || item.type === "official_business_registry" || text.includes("registry") || text.includes("registration")) return "Company Registry";
  if (text.includes("payment") || text.includes("stripe") || text.includes("paypal")) return "Payment Provider";
  if (text.includes("social") || text.includes("facebook") || text.includes("instagram") || text.includes("linkedin") || text.includes("x.com") || text.includes("twitter")) return "Social Profile";
  if (text.includes("brand") || text.includes("trademark")) return "Brand";
  if (item.type === "whois" || item.type === "dns" || text.includes("domain") || text.includes("dns") || text.includes("whois")) return "Domain";
  return undefined;
}

function mergeNode(nodes: Map<string, BusinessGraphNode>, node: BusinessGraphNode) {
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return node;
  }
  existing.evidence = [...existing.evidence, ...node.evidence].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
  if (existing.confidence !== "High" && node.confidence === "High") existing.confidence = node.confidence;
  if (existing.reliability === LOWEST_RELIABILITY && node.reliability !== LOWEST_RELIABILITY) existing.reliability = node.reliability;
  return existing;
}

export function buildBusinessGraph(input: BusinessGraphInput): BusinessGraph {
  const profiles = Array.isArray(input) ? input : [input];
  const nodes = new Map<string, BusinessGraphNode>();
  const edges: BusinessGraph["edges"] = [];

  for (const profile of profiles) {
    const businessValue = profile.businessName === "Unknown" ? profile.primaryDomain : profile.businessName;
    const businessId = `business:${slug(businessValue)}`;
    const businessEvidence = evidenceFromProfile(profile);
    const businessNode = mergeNode(nodes, {
      id: businessId,
      type: "Business",
      label: businessValue,
      normalizedValue: normalizeValue("Business", businessValue),
      source: "business-profile-engine",
      confidence: profile.identityConfidence,
      reliability: profile.evidenceItems[0]?.reliability || LOWEST_RELIABILITY,
      evidence: [businessEvidence],
    });

    const domainEvidence = profile.evidenceItems.find((item) => item.type === "whois" || item.type === "dns") || undefined;
    const domainNode = mergeNode(nodes, {
      id: `domain:${slug(profile.primaryDomain)}`,
      type: "Domain",
      label: profile.primaryDomain,
      normalizedValue: normalizeValue("Domain", profile.primaryDomain),
      source: domainEvidence?.source || "business-profile-engine",
      confidence: profile.infrastructureConfidence,
      reliability: domainEvidence?.reliability || LOWEST_RELIABILITY,
      evidence: [evidenceFromProfile(profile, domainEvidence)],
    });

    edges.push({
      id: `${businessNode.id}->${domainNode.id}:owns`,
      type: "owns",
      from: businessNode.id,
      to: domainNode.id,
      reason: relationshipReason("Domain", domainNode.label),
      evidence: domainNode.evidence,
      confidence: profile.infrastructureConfidence,
    });

    for (const item of profile.evidenceItems) {
      const type = nodeTypeForEvidence(item);
      if (!type || type === "Domain") continue;
      const normalizedValue = normalizeValue(type, item.value);
      const node = mergeNode(nodes, {
        id: `${slug(type)}:${slug(normalizedValue)}`,
        type,
        label: item.value,
        normalizedValue,
        source: item.source,
        confidence: item.confidence,
        reliability: item.reliability,
        evidence: [evidenceFromProfile(profile, item)],
      });
      const edgeType = relationshipForNode(type);
      edges.push({
        id: `${businessNode.id}->${node.id}:${edgeType}`,
        type: edgeType,
        from: businessNode.id,
        to: node.id,
        reason: relationshipReason(type, node.label),
        evidence: node.evidence,
        confidence: item.confidence,
      });
    }
  }

  return {
    engineVersion: BUSINESS_GRAPH_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    nodes: Array.from(nodes.values()),
    edges: edges.filter((edge, index, all) => all.findIndex((candidate) => candidate.id === edge.id) === index),
  };
}

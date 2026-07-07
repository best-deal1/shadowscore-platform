import type { BusinessGraphEdgeType, BusinessGraphNodeType } from "./types";

export function relationshipForNode(type: BusinessGraphNodeType): BusinessGraphEdgeType {
  switch (type) {
    case "Domain":
      return "owns";
    case "Email":
    case "Phone":
    case "Address":
    case "Payment Provider":
    case "Social Profile":
    case "Brand":
      return "uses";
    case "Marketplace":
    case "Company Registry":
      return "verified_by";
    case "Business":
      return "connected_to";
  }
}

export function relationshipReason(type: BusinessGraphNodeType, label: string): string {
  switch (type) {
    case "Domain":
      return `Business profile identifies ${label} as the primary domain or domain ownership context.`;
    case "Email":
      return `Business profile evidence lists ${label} as a contact or email identity.`;
    case "Phone":
      return `Business profile evidence lists ${label} as a phone identity.`;
    case "Address":
      return `Business profile evidence lists ${label} as an address identity.`;
    case "Marketplace":
      return `Marketplace evidence connects the business to ${label}.`;
    case "Company Registry":
      return `Registry evidence connects the business to ${label}.`;
    case "Payment Provider":
      return `Provider evidence connects the business to payment provider ${label}.`;
    case "Social Profile":
      return `Provider evidence connects the business to social profile ${label}.`;
    case "Brand":
      return `Provider evidence connects the business to brand ${label}.`;
    case "Business":
      return `Business profile connects this business identity to ${label}.`;
  }
}

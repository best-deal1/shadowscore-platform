export const BETA_PRODUCT = {
  sku: "business-investigation",
  name: "Business Investigation",
  deliverable: "Executive Report",
  price: "$9.90",
  amount: "9.90",
  currency: "USD",
  period: "one time",
  promise: "One Business Investigation produces one Executive Report for a one-time price of $9.90.",
  includes: [
    "Executive recommendation",
    "Verified findings and evidence gaps",
    "Source trail",
    "Prioritized action plan",
  ],
} as const;


export const PLANNED_PLANS = [
  { name: "Professional", audience: "For analysts with a regular investigation queue", availability: "Planned", features: ["Multiple active investigations", "Reusable review workflow", "Central report library", "Priority support path"] },
  { name: "Business", audience: "For teams managing shared decisions", availability: "Planned", features: ["Shared team workspace", "Role-based access", "Monitoring workflows", "Central billing administration"] },
  { name: "Enterprise", audience: "For organizations with governance requirements", availability: "Contact sales", features: ["Organization access controls", "Procurement and security review", "Workflow configuration", "Dedicated account support"] },
] as const;

export const PLAN_COMPARISON = [
  ["Business identity and submitted scope", "Included", "Included", "Included", "Included"],
  ["Executive Report", "One", "Multiple", "Multiple", "Configured"],
  ["Evidence trail and action plan", "Included", "Included", "Included", "Included"],
  ["Workspace", "Personal", "Personal", "Team", "Organization"],
  ["Monitoring workflows", "Available separately", "Planned", "Planned", "Configured"],
] as const;

export const COMMERCIAL_PATHS = {
  selfService: `${BETA_PRODUCT.name}: ${BETA_PRODUCT.price} USD, ${BETA_PRODUCT.period}`,
  teamPlans: "Professional and Business plans are planned. Enterprise evaluations are available through sales.",
} as const;

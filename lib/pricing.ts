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


export const PRICING_PLANS = [
  { name: "Individual", price: BETA_PRODUCT.price, cadence: BETA_PRODUCT.period, availability: "Available now", audience: "For one business decision that needs a documented investigation", cta: "Start investigation", href: "/intake", recommended: false, features: ["One Business Investigation", "One Executive Report", "Secure workspace access"] },
  { name: "Professional", price: "$49", cadence: "per month", availability: "Early Access", audience: "For analysts with a regular investigation queue", cta: "Contact sales", href: "/contact?subject=Professional", recommended: false, features: ["Multiple active investigations", "Reusable review workflow", "Central report library"] },
  { name: "Business", price: "$199", cadence: "per month", availability: "Early Access", audience: "For teams managing shared decisions", cta: "Contact sales", href: "/contact?subject=Business", recommended: true, features: ["Shared team workspace", "Role-based access", "Monitoring workflows"] },
  { name: "Enterprise", price: "$299", cadence: "per month", availability: "Contact Sales", audience: "For organizations with governance requirements", cta: "Contact sales", href: "/contact?subject=Enterprise", recommended: false, features: ["Organization access controls", "Procurement and security review", "Workflow configuration"] },
] as const;

export const PLANNED_PLANS = PRICING_PLANS.slice(1);

export const PLAN_COMPARISON = [
  ["Business identity and submitted scope", "Included", "Included", "Included", "Included"],
  ["Executive Report", "One", "Multiple", "Multiple", "Configured"],
  ["Evidence trail and action plan", "Included", "Included", "Included", "Included"],
  ["Workspace", "Personal", "Personal", "Team", "Organization"],
  ["Monitoring workflows", "Available separately", "Planned", "Planned", "Configured"],
] as const;

export const COMMERCIAL_PATHS = {
  selfService: `${BETA_PRODUCT.name}: ${BETA_PRODUCT.price} USD, ${BETA_PRODUCT.period}`,
  teamPlans: "Professional and Business plans are available through early access. Enterprise evaluations are available through sales.",
} as const;

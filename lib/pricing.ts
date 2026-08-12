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
  {
    id: "individual",
    name: "Individual",
    label: "Single Investigation",
    price: BETA_PRODUCT.price,
    cadence: "one-time purchase",
    audience: "For one business decision that needs a documented review.",
    features: ["One Business Investigation", "One Executive Report", "Workspace access for that investigation", "Evidence trail and action plan"],
    cta: "Start an investigation",
    href: "/intake",
    recommended: false,
  },
  {
    id: "professional",
    name: "Professional",
    label: "For individual analysts",
    price: "$49",
    cadence: "per month",
    audience: "For professionals who investigate businesses throughout the month.",
    features: ["Higher investigation volume", "Personal investigation workspace", "Reusable review workflow", "Central report library"],
    cta: "Choose Professional",
    href: "/contact?subject=Professional",
    recommended: false,
  },
  {
    id: "business",
    name: "Business",
    label: "For investigation teams",
    price: "$199",
    cadence: "per month",
    audience: "For teams that coordinate investigations and share decisions.",
    features: ["Higher team investigation volume", "Shared team workspace", "Collaboration and shared reports", "Role-based access"],
    cta: "Choose Business",
    href: "/contact?subject=Business",
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    label: "For organizations",
    price: "$299",
    cadence: "per month",
    audience: "For organizations that need governed investigation workflows.",
    features: ["Organization-level controls", "Governance and role policies", "Advanced workflow capabilities", "Priority support"],
    cta: "Choose Enterprise",
    href: "/contact?subject=Enterprise",
    recommended: false,
  },
] as const;

export const PLAN_COMPARISON = [
  ["Investigation access", "One", "Higher volume", "Higher team volume", "Organization volume"],
  ["Executive Reports", "One", "Included", "Shared", "Shared"],
  ["Workspace", "Investigation", "Personal", "Team", "Organization"],
  ["Collaboration", "Individual", "Individual", "Included", "Advanced"],
  ["Access controls", "Account", "Account", "Role-based", "Organization policies"],
  ["Support", "Standard", "Standard", "Team support", "Priority"],
] as const;

export const COMMERCIAL_PATHS = {
  selfService: `${BETA_PRODUCT.name}: ${BETA_PRODUCT.price} USD, ${BETA_PRODUCT.period}`,
  teamPlans: "Professional, Business, and Enterprise plans provide monthly commercial paths.",
} as const;

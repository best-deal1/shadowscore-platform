export const PRICING_PLANS = {
  quick: {
    name: "Quick Investigation",
    price: "$9.90",
    amount: "9.90",
    period: "one time",
  },
  professional: {
    name: "Professional Investigation",
    price: "$49",
    amount: "49.00",
    period: "one time",
  },
  businessIntelligence: {
    name: "Business Intelligence Report",
    price: "$199",
    amount: "199.00",
    period: "one time",
  },
  monitoring: {
    name: "Continuous Monitoring",
    price: "$299",
    amount: "299.00",
    period: "per month",
  },
} as const;

export const QUICK_INVESTIGATION = PRICING_PLANS.quick;

type ProductionRequirement = { key: string; minimumLength: number };

export const paymentProviderConfigurations = [
  {
    id: "paypal",
    name: "PayPal",
    enabled: true,
    requirements: [{ key: "PAYMENT_PROVIDER_PAYPAL_PDT_TOKEN", minimumLength: 8 }],
  },
] as const;

const platformRequirements: readonly ProductionRequirement[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", minimumLength: 12 },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", minimumLength: 20 },
  { key: "SUPABASE_SERVICE_ROLE_KEY", minimumLength: 20 },
  { key: "INVESTIGATION_WORKER_SECRET", minimumLength: 32 },
  { key: "PAYMENT_CALLBACK_SECRET", minimumLength: 32 },
];

export const productionRequirements: readonly ProductionRequirement[] = [
  ...platformRequirements,
  ...paymentProviderConfigurations.filter(({ enabled }) => enabled).flatMap(({ requirements }) => requirements),
];

export type ProductionEnvironment = Record<string, string | undefined>;

export function productionConfigurationIssues(environment: ProductionEnvironment) {
  return productionRequirements.flatMap(({ key, minimumLength }) => {
    const value = environment[key]?.trim() || "";
    if (!value) return [`${key} is missing.`];
    if (value.length < minimumLength) return [`${key} must contain at least ${minimumLength} characters.`];
    if (key === "NEXT_PUBLIC_SUPABASE_URL") {
      try {
        if (new URL(value).protocol !== "https:") return [`${key} must use HTTPS.`];
      } catch {
        return [`${key} must be a valid URL.`];
      }
    }
    return [];
  });
}

export function assertProductionConfiguration(environment: ProductionEnvironment) {
  const issues = productionConfigurationIssues(environment);
  if (issues.length) throw new Error(`Production configuration is incomplete:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
}

import type { ProductDefinition, ProductId } from "./types.ts";

const definitions: readonly ProductDefinition[] = [
  {
    productId: "instant_report",
    productType: "instant_report",
    billingModel: "one_time",
    name: "Instant Report",
    features: new Set(["instant_report.generate", "report.pdf_export"]),
    limits: { monitoredAssets: 0, investigationsPerMonth: 1, reportsPerMonth: 1 },
    exportPermissions: new Set(["pdf"]),
  },
  {
    productId: "starter_monitoring",
    productType: "monitoring",
    billingModel: "recurring",
    name: "Starter Monitoring",
    features: new Set(["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "report.monthly"]),
    limits: { monitoredAssets: 3, investigationsPerMonth: 5, reportsPerMonth: 1 },
    exportPermissions: new Set(),
  },
  {
    productId: "professional_monitoring",
    productType: "monitoring",
    billingModel: "recurring",
    name: "Professional Monitoring",
    features: new Set(["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "dashboard.executive", "report.monthly", "report.pdf_export"]),
    limits: { monitoredAssets: 25, investigationsPerMonth: 50, reportsPerMonth: 10 },
    exportPermissions: new Set(["pdf"]),
  },
  {
    productId: "business_monitoring",
    productType: "monitoring",
    billingModel: "recurring",
    name: "Business Monitoring",
    features: new Set(["watchlist.manage", "alerts.receive", "scan_history.view", "timeline.view", "dashboard.executive", "report.monthly", "report.pdf_export", "api.access"]),
    limits: { monitoredAssets: 100, investigationsPerMonth: 250, reportsPerMonth: 50 },
    exportPermissions: new Set(["pdf"]),
  },
];

const catalog = new Map(definitions.map((product) => [product.productId, product]));

export function getProduct(productId: ProductId): ProductDefinition {
  const product = catalog.get(productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);
  return product;
}

export function listProducts(): readonly ProductDefinition[] {
  return definitions;
}

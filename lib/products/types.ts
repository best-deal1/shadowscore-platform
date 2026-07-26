export type ProductId =
  | "instant_report"
  | "starter_monitoring"
  | "professional_monitoring"
  | "business_monitoring";

export type ProductType = "instant_report" | "monitoring";
export type BillingModel = "one_time" | "recurring";

export type Feature =
  | "instant_report.generate"
  | "report.pdf_export"
  | "watchlist.manage"
  | "alerts.receive"
  | "scan_history.view"
  | "timeline.view"
  | "dashboard.executive"
  | "report.monthly"
  | "api.access";

export type ProductLimits = {
  monitoredAssets: number;
  investigationsPerMonth: number;
  reportsPerMonth: number;
};

export type ProductDefinition = {
  productId: ProductId;
  productType: ProductType;
  billingModel: BillingModel;
  name: string;
  features: ReadonlySet<Feature>;
  limits: ProductLimits;
  exportPermissions: ReadonlySet<"pdf">;
};

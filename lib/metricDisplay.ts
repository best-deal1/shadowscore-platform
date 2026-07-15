export type MetricEvidenceKind = "measured" | "inferred" | "estimated" | "unknown";
export type QualitativeMetric = "Very High" | "High" | "Medium" | "Low" | "Unknown";

export function qualitativeFromScore(value?: number | null): QualitativeMetric {
  if (typeof value !== "number" || Number.isNaN(value)) return "Unknown";
  if (value >= 85) return "Very High";
  if (value >= 65) return "High";
  if (value >= 40) return "Medium";
  return "Low";
}

export function qualitativeFromRisk(value?: number | null): QualitativeMetric {
  if (typeof value !== "number" || Number.isNaN(value)) return "Unknown";
  if (value >= 75) return "Very High";
  if (value >= 55) return "High";
  if (value >= 30) return "Medium";
  return "Low";
}

export function metricProvenance(kind: MetricEvidenceKind) {
  if (kind === "measured") return "Measured from direct records or counts.";
  if (kind === "inferred") return "Inferred from available evidence; shown as a qualitative level to avoid false precision.";
  if (kind === "estimated") return "Estimated from available signals; shown as a qualitative level to avoid false precision.";
  return "Unknown until supporting evidence is available.";
}

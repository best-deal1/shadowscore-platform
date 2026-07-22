export type MarketingEvent = "hero_cta_clicked" | "sample_report_viewed" | "company_check_viewed" | "company_registry_viewed" | "company_extract_viewed" | "supplier_verification_viewed" | "methodology_viewed" | "start_due_diligence_clicked" | "language_changed";
/** Event names only. Callers must not attach targets, contact information, or evidence. */
export function trackMarketingEvent(event: MarketingEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("shadowscore:marketing", { detail: { event } }));
}

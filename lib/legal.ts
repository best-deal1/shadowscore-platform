export const LEGAL_ACCEPTANCE_VERSION = "SS-LEGAL-V17.1-2026-06";

export const legalAcceptanceBullets = [
  "ShadowScore provides risk intelligence, estimates and analytical insights only.",
  "ShadowScore does not guarantee account approval, account reinstatement, suspension prevention, payment release, marketplace acceptance, revenue growth, sales performance or business outcomes.",
  "Risk scores are estimates generated using publicly available information, user-provided information, AI analysis and proprietary models. They may not reflect actual marketplace or payment-provider decisions.",
  "Marketplace operators and payment providers, including eBay, Amazon, Etsy, Walmart, TikTok Shop, PayPal, Payoneer, Stripe and others, make independent decisions that ShadowScore cannot control.",
  "All final business, compliance, operational and legal decisions remain the responsibility of the user.",
  "Once a report, scan, review or analysis has been generated or delivered, the service is considered consumed and non-refundable.",
  "By proceeding, I agree to the Terms of Service and Privacy Policy.",
];

export function generateReportId(prefix = "SS") {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100).toString();
  return `${prefix}-${year}-${stamp}${random}`;
}

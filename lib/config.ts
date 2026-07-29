export const WHATSAPP_NUMBER = "972557293979";
export const TIKTOK_URL = "https://www.tiktok.com/@shadowscore8";

export const SITE_URL = "https://shadowscore.io";
export const LINKEDIN_URL = "https://www.linkedin.com/company/shadowscore";
export const X_URL = "https://x.com/shadowscore";
export const YOUTUBE_URL = "https://www.youtube.com/@shadowscore";
export const CONTACT_EMAIL = "info@shadowscore.io";
export const SUPPORT_EMAIL = "help@shadowscore.io";
export const PRIVACY_EMAIL = "privacy@shadowscore.io";
export const PARTNERS_EMAIL = "partners@shadowscore.io";

// Use a verified PayPal business email before going live.
// If info@shadowscore.io is not verified in PayPal yet, replace this with the verified PayPal account email.
export const PAYPAL_BUSINESS_EMAIL = "sales@best-deal.org";

export function getPayPalPdtIdentityToken() {
  return process.env.PAYPAL_PDT_IDENTITY_TOKEN?.trim() || "";
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

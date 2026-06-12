export const WHATSAPP_NUMBER = "972557293979";
export const TIKTOK_URL = "https://www.tiktok.com/@shadowscore8";
export const PAYPAL_BUSINESS_EMAIL = "sales@best-deal.org";

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

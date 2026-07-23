import type { Metadata } from "next";
import en from "../../messages/en.json" with { type: "json" };
import he from "../../messages/he.json" with { type: "json" };
import es from "../../messages/es.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };
import de from "../../messages/de.json" with { type: "json" };
import it from "../../messages/it.json" with { type: "json" };
import pt from "../../messages/pt.json" with { type: "json" };
import nl from "../../messages/nl.json" with { type: "json" };
import pl from "../../messages/pl.json" with { type: "json" };
import ar from "../../messages/ar.json" with { type: "json" };

export const supportedLocales = ["en", "he", "es", "fr", "de", "it", "pt", "nl", "pl", "ar"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultMarketingLocale: SupportedLocale = "en";
export const localizedLocaleNames: Record<SupportedLocale, string> = {
  en: "English", he: "עברית", es: "Español", fr: "Français", de: "Deutsch", it: "Italiano", pt: "Português", nl: "Nederlands", pl: "Polski", ar: "العربية",
};
export const localizedDirections: Record<SupportedLocale, "ltr" | "rtl"> = { en: "ltr", he: "rtl", es: "ltr", fr: "ltr", de: "ltr", it: "ltr", pt: "ltr", nl: "ltr", pl: "ltr", ar: "rtl" };
const messages = { en, he, es, fr, de, it, pt, nl, pl, ar } as const;
export type MarketingMessages = typeof en;
export const isSupportedLocale = (value: string): value is SupportedLocale => (supportedLocales as readonly string[]).includes(value);
export const getMarketingMessages = (locale: SupportedLocale): MarketingMessages => messages[locale] as MarketingMessages;
export const localizedPath = (pathname: string, locale: SupportedLocale) => {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\/(?:en|he|es|fr|de|it|pt|nl|pl|ar)(?=\/|$)/, "");
  return locale === defaultMarketingLocale ? normalized || "/" : `/${locale}${normalized || ""}`;
};

const localeTags: Record<SupportedLocale, string> = { en: "en_US", he: "he_IL", es: "es_ES", fr: "fr_FR", de: "de_DE", it: "it_IT", pt: "pt_PT", nl: "nl_NL", pl: "pl_PL", ar: "ar_AE" };
export function localizedMarketingMetadata(locale: SupportedLocale, slug: string): Metadata {
  const copy = getMarketingMessages(locale).marketing;
  const path = localizedPath(`/${slug}`, locale);
  const languages = Object.fromEntries(supportedLocales.map((item) => [item, localizedPath(`/${slug}`, item)]));
  return { title: copy.title, description: copy.description, alternates: { canonical: path, languages: { ...languages, "x-default": localizedPath(`/${slug}`, defaultMarketingLocale) } }, openGraph: { title: copy.title, description: copy.description, url: `https://shadowscore.io${path}`, locale: localeTags[locale], type: "website" }, twitter: { card: "summary_large_image", title: copy.title, description: copy.description } };
}

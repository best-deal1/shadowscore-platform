"use client";
import { createContext, useContext, type ReactNode } from "react";
import { defaultLocale, getDictionary, type Locale } from "../lib/i18n";
const Context = createContext({ locale: defaultLocale as Locale, t: getDictionary(defaultLocale) });
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) { return <Context.Provider value={{ locale, t: getDictionary(locale) }}>{children}</Context.Provider>; }
export function useLocale() { return useContext(Context); }
export function TechnicalValue({ children }: { children: ReactNode }) { return <bdi dir="ltr" className="unicode-bidi-isolate">{children}</bdi>; }

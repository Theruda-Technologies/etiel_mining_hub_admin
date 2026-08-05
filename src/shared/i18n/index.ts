"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";

export const locales = ["en", "am"] as const;
export type AppLocale = (typeof locales)[number];

const STORAGE_KEY = "etiel-admin-locale";

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "am" || stored === "en" ? stored : "en";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function setAppLocale(locale: AppLocale) {
  void i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "am" ? "am" : "en";
  }
}

export function bootstrapLocale() {
  const locale = readStoredLocale();
  setAppLocale(locale);
  return locale;
}

export default i18n;

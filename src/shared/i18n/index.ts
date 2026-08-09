"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "./locale";

export {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  locales,
  type AppLocale,
} from "./locale";

const STORAGE_KEY = LOCALE_COOKIE;

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
}

function writeLocaleCookie(locale: AppLocale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

function syncResourceBundles() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("am", "translation", am, true, true);
}

const resources = {
  en: { translation: en },
  am: { translation: am },
};

export function ensureI18n(initialLocale: AppLocale = DEFAULT_LOCALE) {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: initialLocale,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else {
    // Keep HMR'd locale JSON and SSR locale in sync with the singleton.
    syncResourceBundles();
    if (i18n.language !== initialLocale) {
      void i18n.changeLanguage(initialLocale);
    }
  }
  return i18n;
}

// Initialize with default; provider may re-sync with cookie locale before paint.
ensureI18n(DEFAULT_LOCALE);

export function setAppLocale(locale: AppLocale) {
  void i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, locale);
    writeLocaleCookie(locale);
    document.documentElement.lang = locale === "am" ? "am" : "en";
  }
}

/** Apply saved preference after mount only when no server locale was provided. */
export function bootstrapLocale() {
  const locale = readStoredLocale();
  setAppLocale(locale);
  return locale;
}

export default i18n;

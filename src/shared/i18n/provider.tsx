"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, {
  bootstrapLocale,
  ensureI18n,
  setAppLocale,
  type AppLocale,
  DEFAULT_LOCALE,
} from "./index";

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  localeFromCookie = false,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  localeFromCookie?: boolean;
}) {
  // Sync language before paint so SSR HTML and client hydration use the same locale.
  ensureI18n(initialLocale);

  useEffect(() => {
    ensureI18n(initialLocale);
    if (localeFromCookie) {
      setAppLocale(initialLocale);
      return;
    }
    // No cookie yet: migrate localStorage preference (and write the cookie).
    bootstrapLocale();
  }, [initialLocale, localeFromCookie]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

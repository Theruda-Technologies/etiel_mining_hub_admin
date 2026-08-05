"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { bootstrapLocale, DEFAULT_LOCALE } from "./index";

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // First paint stays on DEFAULT_LOCALE (matches SSR), then apply saved preference.
    void i18n.changeLanguage(DEFAULT_LOCALE).finally(() => {
      bootstrapLocale();
    });
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

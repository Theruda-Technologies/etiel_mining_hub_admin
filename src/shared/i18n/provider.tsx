"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { bootstrapLocale } from "./index";

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootstrapLocale();
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, setAppLocale, type AppLocale } from "./index";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR + first client paint always use DEFAULT_LOCALE to avoid hydration mismatch.
  const current = (
    mounted && i18n.language?.startsWith("en") ? "en" : DEFAULT_LOCALE
  ) as AppLocale;

  return (
    <label className={className}>
      <span className="sr-only" suppressHydrationWarning>
        {t("common.language")}
      </span>
      <select
        value={current}
        onChange={(e) => setAppLocale(e.target.value as AppLocale)}
        className="h-9 rounded-full border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none focus:border-accent/50"
        suppressHydrationWarning
      >
        <option value="en">{t("common.english")}</option>
        <option value="am">{t("common.amharic")}</option>
      </select>
    </label>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { setAppLocale, type AppLocale } from "./index";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.startsWith("am") ? "am" : "en") as AppLocale;

  return (
    <label className={className}>
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={current}
        onChange={(e) => setAppLocale(e.target.value as AppLocale)}
        className="h-9 rounded-full border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none focus:border-accent/50"
      >
        <option value="en">{t("common.english")}</option>
        <option value="am">{t("common.amharic")}</option>
      </select>
    </label>
  );
}

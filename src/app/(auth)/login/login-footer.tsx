"use client";

import { useTranslation } from "react-i18next";

export function LoginFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase">
      <p>{t("login.footerCopyright")}</p>
      <a href="mailto:support@etiel.mining" className="hover:text-accent">
        {t("login.technicalSupport")}
      </a>
    </footer>
  );
}

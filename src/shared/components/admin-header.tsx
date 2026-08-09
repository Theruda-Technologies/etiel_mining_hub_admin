"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MenuIcon, SearchIcon } from "./icons";
import { ProfileAvatar } from "./profile-avatar";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";
import { useSearchQuery } from "./search-context";
import { useMobileNav } from "./mobile-nav-context";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";

export function AdminHeader() {
  const { t } = useTranslation();
  const { user } = useAuthUser();
  const { query, setQuery } = useSearchQuery();
  const { toggle } = useMobileNav();

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-strong md:hidden"
            aria-label={t("common.menu")}
          >
            <MenuIcon className="size-4" />
          </button>
          <p className="font-display truncate text-[15px] font-medium text-foreground">
            {t("common.adminHub")}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden sm:block" />
          <label className="relative hidden w-[min(240px,32vw)] md:block">
            <span className="sr-only">{t("common.search")}</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="h-9 w-full rounded-full border border-border bg-surface pr-4 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
          </label>
          <Link
            href="/settings"
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={t("nav.settings")}
          >
            <ProfileAvatar
              src={user?.avatarUrl}
              name={user?.name ?? "User"}
              size={36}
            />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <LanguageSwitcher className="shrink-0" />
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t("common.search")}</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="h-9 w-full rounded-full border border-border bg-surface pr-4 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
        </label>
      </div>
    </header>
  );
}

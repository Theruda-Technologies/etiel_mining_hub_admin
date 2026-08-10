"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils";
import {
  CloseIcon,
  CraneIcon,
  GearIcon,
  GridIcon,
  HelpIcon,
  LogoutIcon,
  PackageIcon,
} from "./icons";
import { useMobileNav } from "./mobile-nav-context";
import type { AuthSession, UserRole } from "@/features/auth/types";
import { canAccessRoute } from "@/features/auth/types";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: GridIcon },
  { href: "/orders", key: "orders", icon: PackageIcon },
  { href: "/products", key: "products", icon: CraneIcon },
  { href: "/qas", key: "qas", icon: HelpIcon },
  { href: "/settings", key: "settings", icon: GearIcon },
] as const;

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen } = useMobileNav();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: AuthSession } | null) => {
        setSession(data?.user ?? null);
      })
      .catch(() => setSession(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const role: UserRole = session?.role ?? "admin";
  const visibleNav = navItems.filter((item) =>
    canAccessRoute(role, item.href),
  );

  const nav = (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-6">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <img
            src="/etiel-logo.png"
            alt=""
            className="h-10 w-auto shrink-0 object-contain"
          />
          <span className="font-display text-[15px] leading-snug font-semibold tracking-tight text-foreground">
            {t("nav.brand")}
          </span>
        </Link>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted md:hidden"
          onClick={() => setOpen(false)}
          aria-label={t("common.close")}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {visibleNav.map(({ href, key, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors",
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted-strong hover:bg-white/5 hover:text-foreground",
              )}
            >
              {active ? (
                <span className="absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <Icon className="size-[18px] shrink-0" />
              <span>{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-6">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] text-danger transition-colors hover:bg-danger-soft"
        >
          <LogoutIcon className="size-[18px] shrink-0" />
          <span>{t("common.logout")}</span>
        </button>
        <p className="mt-6 px-3 text-[11px] text-muted">{t("nav.copyright")}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label={t("common.close")}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(280px,86vw)] flex-col border-r border-border bg-sidebar shadow-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}

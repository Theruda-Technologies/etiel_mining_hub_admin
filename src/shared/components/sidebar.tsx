"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/shared/utils";
import {
  CraneIcon,
  GearIcon,
  GridIcon,
  LogoutIcon,
  PackageIcon,
} from "./icons";
import type { AuthSession, UserRole } from "@/features/auth/types";
import { canAccessRoute } from "@/features/auth/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/orders", label: "Orders", icon: PackageIcon },
  {
    href: "/products",
    label: "Products and Services",
    icon: CraneIcon,
  },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 pt-6 pb-8">
        <p className="text-[13px] font-bold tracking-[0.08em] text-accent uppercase">
          Etiel Mining Hub
        </p>
        <p className="mt-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
          Operational Center
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
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
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] text-danger transition-colors hover:bg-danger-soft"
        >
          <LogoutIcon className="size-[18px] shrink-0" />
          <span>Logout</span>
        </button>
        <p className="mt-6 px-3 text-[11px] text-muted">© 2024 Etiel Admin</p>
      </div>
    </aside>
  );
}

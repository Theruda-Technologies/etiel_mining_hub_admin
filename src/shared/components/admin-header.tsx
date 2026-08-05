"use client";

import Link from "next/link";
import { SearchIcon } from "./icons";
import { ProfileAvatar } from "./profile-avatar";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";
import { useSearchQuery } from "./search-context";

export function AdminHeader() {
  const { user } = useAuthUser();
  const { query, setQuery } = useSearchQuery();

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-8 py-3">
      <p className="text-[15px] font-medium text-foreground">Admin Hub</p>
      <div className="flex items-center gap-3">
        <label className="relative block w-[240px]">
          <span className="sr-only">Search</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-9 w-full rounded-full border border-border bg-surface pr-4 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
        </label>
        <Link
          href="/settings"
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Open profile settings"
        >
          <ProfileAvatar
            src={user?.avatarUrl}
            name={user?.name ?? "User"}
            size={36}
          />
        </Link>
      </div>
    </header>
  );
}

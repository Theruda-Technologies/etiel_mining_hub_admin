"use client";

import { useTranslation } from "react-i18next";
import { UsersTable } from "@/features/users";
import type { AdminUser } from "@/features/users/types";

export function UsersPageClient({ users }: { users: AdminUser[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("users.title")}</h1>
      <UsersTable users={users} />
    </div>
  );
}

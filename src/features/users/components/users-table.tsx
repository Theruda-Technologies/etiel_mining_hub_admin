"use client";

import { useTranslation } from "react-i18next";
import { ProfileAvatar } from "@/shared/components/profile-avatar";
import type { AdminUser } from "../types";

type UsersTableProps = {
  users: AdminUser[];
};

export function UsersTable({ users }: UsersTableProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return <p className="text-sm text-muted">{t("users.noUsers")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              {t("settings.name")}
            </th>
            <th className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              {t("users.email")}
            </th>
            <th className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              {t("users.role")}
            </th>
            <th className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              {t("users.created")}
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2.5">
                  <ProfileAvatar
                    src={user.avatarUrl}
                    name={user.fullName || user.email}
                    size={32}
                  />
                  <span className="text-[13px] text-foreground">
                    {user.fullName}
                  </span>
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-muted-strong">
                {user.email}
              </td>
              <td className="px-4 py-3 text-[13px] text-foreground">
                {user.role}
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-muted">
                {user.createdAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

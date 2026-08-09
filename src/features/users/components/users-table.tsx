"use client";

import { useTranslation } from "react-i18next";
import type { AdminUser } from "../types";

type UsersTableProps = {
  users: AdminUser[];
};

export function UsersTable({ users }: UsersTableProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return <p className="text-sm text-zinc-500">{t("users.noUsers")}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-zinc-200 text-zinc-500">
        <tr>
          <th className="py-2 font-medium">{t("users.email")}</th>
          <th className="py-2 font-medium">{t("users.role")}</th>
          <th className="py-2 font-medium">{t("users.created")}</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-zinc-100">
            <td className="py-2">{user.email}</td>
            <td className="py-2">{user.role}</td>
            <td className="py-2">{user.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

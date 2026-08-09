"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuthSession, UserRole } from "@/features/auth/types";
import {
  ROLE_PERMISSIONS,
  canBlockUser,
  roleLabel,
} from "@/features/auth/types";
import {
  ChevronDownIcon,
  KeyIcon,
  LockIcon,
  SendIcon,
  UserIcon,
} from "@/shared/components/icons";
import { ClickableAvatar } from "@/shared/components/clickable-avatar";
import { useSearchQuery } from "@/shared/components/search-context";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
};

const inputClass =
  "h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50";

export function SettingsPanel({ session }: { session: AuthSession }) {
  const { t } = useTranslation();
  const canInvite = session.role === "super_admin";
  const canManageUsers =
    canInvite || ROLE_PERMISSIONS[session.role].canBlockAdmins;
  const { query } = useSearchQuery();

  const [fullName, setFullName] = useState(session.name);
  const [avatarUrl, setAvatarUrl] = useState(session.avatarUrl ?? "");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("admin");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState("");

  async function loadUsers() {
    if (!canManageUsers) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = (await res.json()) as { users?: AdminUser[] };
      if (res.ok) setUsers(data.users ?? []);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [canManageUsers]);

  const filteredUsers = useMemo(() => {
    const q = (userFilter.trim() || query.trim()).toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        roleLabel(user.role).toLowerCase().includes(q) ||
        user.status.toLowerCase().includes(q),
    );
  }, [users, userFilter, query]);

  async function saveProfile(nextAvatarUrl?: string) {
    setProfileBusy(true);
    setProfileError(null);
    setProfileMessage(null);
    const avatar = nextAvatarUrl !== undefined ? nextAvatarUrl : avatarUrl;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          avatarUrl: avatar.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setProfileError(data.error ?? t("settings.profileUpdateFailed"));
        return false;
      }
      setProfileMessage(t("settings.profileUpdated"));
      window.dispatchEvent(new Event("auth-profile-updated"));
      return true;
    } catch {
      setProfileError(t("settings.profileUnreachable"));
      return false;
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleProfileUpdate(event: FormEvent) {
    event.preventDefault();
    await saveProfile();
  }

  async function handleAvatarUploaded(url: string) {
    setAvatarUrl(url);
    await saveProfile(url);
  }

  async function handlePasswordUpdate(event: FormEvent) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError(t("settings.passwordTooShort"));
      setPasswordBusy(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      setPasswordBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPasswordError(data.error ?? t("settings.passwordUpdateFailed"));
      } else {
        setPasswordMessage(t("settings.passwordUpdated"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError(t("settings.authUnreachable"));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setInviteBusy(true);
    setInviteError(null);
    setInviteMessage(null);

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        emailReason?: string;
      };

      if (!res.ok) {
        setInviteError(data.error ?? t("settings.inviteFailed"));
        return;
      }

      if (data.emailSent) {
        setInviteMessage(t("settings.inviteEmailed"));
        setInviteError(null);
      } else {
        setInviteMessage(t("settings.inviteCreatedNoEmail"));
        setInviteError(
          data.emailReason ?? t("settings.inviteEmailNotSent"),
        );
      }
      setInviteName("");
      setInviteEmail("");
      await loadUsers();
    } catch {
      setInviteError(t("settings.inviteUnreachable"));
    } finally {
      setInviteBusy(false);
    }
  }

  async function revokeInvite(id: string) {
    setUserActionId(id);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await loadUsers();
    } finally {
      setUserActionId(null);
    }
  }

  async function setUserBlocked(user: AdminUser, blocked: boolean) {
    setUserActionId(user.id);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          status: blocked ? "suspended" : "active",
        }),
      });
      if (res.ok) await loadUsers();
    } finally {
      setUserActionId(null);
    }
  }

  function renderUserActions(user: AdminUser) {
    const busy = userActionId === user.id;
    const actions: React.ReactNode[] = [];

    if (
      canInvite &&
      user.status === "invited" &&
      user.id !== session.id
    ) {
      actions.push(
        <button
          key="revoke"
          type="button"
          disabled={busy}
          onClick={() => void revokeInvite(user.id)}
          className="font-mono text-[11px] font-semibold tracking-wide text-danger uppercase hover:underline disabled:opacity-60"
        >
          {t("settings.revoke")}
        </button>,
      );
    }

    if (
      user.id !== session.id &&
      canBlockUser(session.role, user.role) &&
      (user.status === "active" ||
        user.status === "suspended" ||
        user.status === "invited")
    ) {
      const blocked = user.status === "suspended";
      actions.push(
        <button
          key="block"
          type="button"
          disabled={busy}
          onClick={() => void setUserBlocked(user, !blocked)}
          className={`font-mono text-[11px] font-semibold tracking-wide uppercase hover:underline disabled:opacity-60 ${
            blocked ? "text-success" : "text-danger"
          }`}
        >
          {blocked ? t("settings.unblock") : t("settings.block")}
        </button>,
      );
    }

    if (actions.length === 0) {
      return (
        <span className="font-mono text-[11px] text-muted">—</span>
      );
    }

    return <div className="flex flex-wrap items-center gap-3">{actions}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[28px] font-bold tracking-tight text-foreground">
          {t("settings.title")}
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">
          {t("settings.subtitle")}
        </p>
        <div className="mt-5 h-px bg-border" />
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserIcon className="size-4 text-accent" />
          <h3 className="text-[15px] font-medium text-accent">
            {t("settings.profile")}
          </h3>
        </div>
        <form
          onSubmit={handleProfileUpdate}
          className="grid gap-6 md:grid-cols-[auto_1fr]"
        >
          <ClickableAvatar
            src={avatarUrl || session.avatarUrl}
            name={fullName || session.name}
            size={96}
            onUploaded={handleAvatarUploaded}
          />
          <div className="space-y-4">
            <Field label={t("settings.displayName")}>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder={t("settings.placeholderName")}
              />
            </Field>
            <p className="text-[12px] text-muted">{session.email}</p>
            {profileError ? (
              <p className="text-[12px] text-danger">{profileError}</p>
            ) : null}
            {profileMessage ? (
              <p className="text-[12px] text-success">{profileMessage}</p>
            ) : null}
            <button
              type="submit"
              disabled={profileBusy}
              className="h-11 rounded-md bg-accent px-5 text-[13px] font-semibold tracking-wide text-black uppercase disabled:opacity-60"
            >
              {profileBusy
                ? t("settings.saving")
                : t("settings.saveProfile")}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid xl:grid-cols-2 xl:divide-x xl:divide-border">
          <div className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <LockIcon className="size-4 text-accent" />
              <h3 className="text-[15px] font-medium text-accent">
                {t("settings.security")}
              </h3>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Field label={t("settings.currentPassword")}>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Field label={t("settings.newPassword")}>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={8}
                />
              </Field>
              <Field label={t("settings.confirmPassword")}>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={8}
                />
              </Field>

              {passwordError ? (
                <p className="text-[12px] text-danger">{passwordError}</p>
              ) : null}
              {passwordMessage ? (
                <p className="text-[12px] text-success">{passwordMessage}</p>
              ) : null}

              <button
                type="submit"
                disabled={passwordBusy}
                className="mt-2 h-11 w-full rounded-md bg-accent text-[13px] font-semibold tracking-wide text-black uppercase disabled:opacity-60"
              >
                {passwordBusy
                  ? t("settings.updating")
                  : t("settings.updatePassword")}
              </button>
            </form>
          </div>

          <div className="border-t border-border p-6 xl:border-t-0">
            <div className="mb-2 flex items-center gap-2">
              <KeyIcon className="size-4 text-accent" />
              <h3 className="text-[15px] font-medium text-accent">
                {t("settings.adminAccess")}
              </h3>
            </div>
            <p className="mb-6 text-[13px] text-muted">
              {canInvite
                ? t("settings.adminAccessHint")
                : t("settings.adminBlockHint")}
            </p>

            {canInvite ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("settings.fullName")}>
                    <input
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className={inputClass}
                      placeholder={t("settings.placeholderInviteName")}
                    />
                  </Field>
                  <Field label={t("settings.email")}>
                    <input
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={inputClass}
                      placeholder="j.doe@etiel.com"
                    />
                  </Field>
                </div>

                <Field label={t("settings.role")}>
                  <span className="relative block">
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as UserRole)
                      }
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="admin">{t("settings.roleAdmin")}</option>
                      <option value="super_admin">
                        {t("settings.roleSuperAdmin")}
                      </option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                  </span>
                </Field>

                {inviteError ? (
                  <p className="text-[12px] text-danger">{inviteError}</p>
                ) : null}
                {inviteMessage ? (
                  <p className="text-[12px] text-success">{inviteMessage}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={inviteBusy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold tracking-wide text-black uppercase disabled:opacity-60"
                >
                  {inviteBusy
                    ? t("settings.dispatching")
                    : t("settings.dispatch")}
                  {!inviteBusy ? <SendIcon className="size-4" /> : null}
                </button>
              </form>
            ) : null}

            {canManageUsers ? (
              <div className={canInvite ? "mt-8" : undefined}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[11px] tracking-[0.1em] text-accent uppercase">
                    {t("settings.users")}
                  </p>
                  <input
                    type="search"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    placeholder={t("settings.searchUsers")}
                    className="h-8 w-full max-w-[220px] rounded-md border border-border bg-background px-3 text-[12px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border">
                        {[
                          t("settings.name"),
                          t("login.email"),
                          t("settings.role"),
                          t("settings.status"),
                          t("settings.action"),
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-1 py-2.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted uppercase"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-1 py-4 text-[12px] text-muted"
                          >
                            {t("common.loading")}
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-1 py-4 text-[12px] text-muted"
                          >
                            {t("settings.noUsers")}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-1 py-3.5 text-[13px] text-foreground">
                              {user.full_name}
                            </td>
                            <td className="px-1 py-3.5 font-mono text-[12px] text-muted-strong">
                              {user.email}
                            </td>
                            <td className="px-1 py-3.5">
                              <span className="rounded bg-[#2a2a2a] px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted-strong uppercase">
                                {user.role === "super_admin"
                                  ? t("settings.roleSuperAdmin")
                                  : t("settings.roleAdmin")}
                              </span>
                            </td>
                            <td className="px-1 py-3.5 font-mono text-[11px] tracking-wide text-muted uppercase">
                              {user.status === "suspended"
                                ? t("settings.statusSuspended")
                                : user.status === "invited"
                                  ? t("settings.statusInvited")
                                  : t("settings.statusActive")}
                            </td>
                            <td className="px-1 py-3.5">
                              {renderUserActions(user)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-background px-4 py-5">
                <p className="text-[13px] text-muted">
                  {t("settings.inviteOnlySuperAdmin", {
                    role: t(
                      session.role === "super_admin"
                        ? "settings.roleSuperAdmin"
                        : "settings.roleAdmin",
                    ),
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
      {label}
      <div className="mt-1.5 normal-case tracking-normal">{children}</div>
    </label>
  );
}

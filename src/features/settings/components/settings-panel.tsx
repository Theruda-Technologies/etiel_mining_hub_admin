"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuthSession, UserRole } from "@/features/auth/types";
import { ROLE_PERMISSIONS, roleLabel } from "@/features/auth/types";
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
  const canInvite = session.role === "super_admin";
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
  const [inviteRole, setInviteRole] = useState<UserRole>("super_admin");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastPassword, setLastPassword] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  async function loadUsers() {
    if (!canInvite) return;
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
  }, [canInvite]);

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
        setProfileError(data.error ?? "Unable to update profile.");
        return false;
      }
      setProfileMessage("Profile updated.");
      window.dispatchEvent(new Event("auth-profile-updated"));
      return true;
    } catch {
      setProfileError("Unable to reach profile service.");
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
      setPasswordError("New password must be at least 8 characters.");
      setPasswordBusy(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
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
        setPasswordError(data.error ?? "Unable to update password.");
      } else {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Unable to reach auth service.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setInviteBusy(true);
    setInviteError(null);
    setInviteMessage(null);
    setLastPassword(null);

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
        temporaryPassword?: string;
      };

      if (!res.ok) {
        setInviteError(data.error ?? "Invitation failed.");
        return;
      }

      setLastPassword(data.temporaryPassword ?? null);
      setInviteMessage(
        data.emailSent
          ? "Invitation dispatched. Credentials were emailed."
          : data.emailReason ??
              "Account created. Copy the temporary password below.",
      );
      setInviteName("");
      setInviteEmail("");
      await loadUsers();
    } catch {
      setInviteError("Unable to dispatch invitation.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await loadUsers();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
          System Settings
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">
          Manage administrative access and security protocols.
        </p>
        <div className="mt-5 h-px bg-border" />
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserIcon className="size-4 text-accent" />
          <h3 className="text-[15px] font-medium text-accent">Profile</h3>
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
            <Field label="Display Name">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
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
              {profileBusy ? "Saving…" : "Save Profile"}
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
                Security Configuration
              </h3>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Field label="Current Password">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="New Password">
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
              <Field label="Confirm New Password">
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
                {passwordBusy ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>

          <div className="border-t border-border p-6 xl:border-t-0">
            <div className="mb-2 flex items-center gap-2">
              <KeyIcon className="size-4 text-accent" />
              <h3 className="text-[15px] font-medium text-accent">
                Administrative Access
              </h3>
            </div>
            <p className="mb-6 text-[13px] text-muted">
              Grant operational access to new administrative personnel.
            </p>

            {canInvite ? (
              <>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name">
                      <input
                        required
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className={inputClass}
                        placeholder="John Doe"
                      />
                    </Field>
                    <Field label="Institutional Email">
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

                  <Field label="Role Assignment">
                    <span className="relative block">
                      <select
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as UserRole)
                        }
                        className={`${inputClass} appearance-none pr-9`}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
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
                  {lastPassword ? (
                    <p className="rounded-md border border-border bg-background px-3 py-2 font-mono text-[12px] text-accent">
                      Temporary password: {lastPassword}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={inviteBusy}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold tracking-wide text-black uppercase disabled:opacity-60"
                  >
                    {inviteBusy ? "Dispatching…" : "Dispatch Invitation"}
                    {!inviteBusy ? <SendIcon className="size-4" /> : null}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] tracking-[0.1em] text-accent uppercase">
                      Users
                    </p>
                    <input
                      type="search"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      placeholder="Search users…"
                      className="h-8 w-full max-w-[220px] rounded-md border border-border bg-background px-3 text-[12px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border">
                          {["Name", "Email", "Role", "Status", "Action"].map(
                            (heading) => (
                              <th
                                key={heading}
                                className="px-1 py-2.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted uppercase"
                              >
                                {heading}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingUsers ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-1 py-4 text-[12px] text-muted"
                            >
                              Loading…
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-1 py-4 text-[12px] text-muted"
                            >
                              No users match your search.
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
                                  {roleLabel(user.role)}
                                </span>
                              </td>
                              <td className="px-1 py-3.5 font-mono text-[11px] tracking-wide text-muted uppercase">
                                {user.status}
                              </td>
                              <td className="px-1 py-3.5">
                                {user.status === "invited" &&
                                user.id !== session.id ? (
                                  <button
                                    type="button"
                                    onClick={() => void revokeInvite(user.id)}
                                    className="font-mono text-[11px] font-semibold tracking-wide text-danger uppercase hover:underline"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span className="font-mono text-[11px] text-muted">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-border bg-background px-4 py-5">
                <p className="text-[13px] text-muted">
                  Signed in as{" "}
                  <span className="text-accent">
                    {ROLE_PERMISSIONS[session.role].label}
                  </span>
                  . Only a Super Admin can dispatch invitations and manage
                  users.
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

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { KeyIcon, LoginArrowIcon } from "@/shared/components/icons";
import { PasswordInput } from "@/shared/components/password-input";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";
import { createClient } from "@/lib/supabase/client";

/**
 * Do NOT verify the recovery token on page load.
 * Email security scanners often prefetch links and would burn a one-time OTP.
 * Verify only when the user submits a new password.
 */
export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<EmailOtpType>("recovery");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);

    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("error")) {
      setLinkError(
        hashParams.get("error_description")?.replaceAll("+", " ") ||
          t("login.resetLinkInvalid"),
      );
      return;
    }

    const fromQuery = url.searchParams.get("token_hash");
    if (fromQuery) {
      setTokenHash(fromQuery);
      setTokenType(
        (url.searchParams.get("type") as EmailOtpType | null) || "recovery",
      );
      // Keep token in memory; strip from URL so refreshes/shares don't leak it.
      window.history.replaceState({}, "", "/reset-password");
      return;
    }

    setLinkError(t("login.resetLinkInvalid"));
  }, [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!tokenHash) {
      setError(t("login.resetLinkInvalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("settings.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("settings.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: tokenType,
      });
      if (otpError) {
        setError(otpError.message || t("login.resetLinkInvalid"));
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setMessage(t("login.resetSuccess"));
      setTokenHash(null);
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch {
      setError(t("login.authUnreachable"));
      setLoading(false);
    }
  }

  const canReset = Boolean(tokenHash) && !linkError;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-[400px] overflow-hidden border border-white/10 bg-[#141414]/95 shadow-2xl backdrop-blur-sm"
    >
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="px-5 pt-10 pb-8 sm:px-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/etiel-logo.png"
            alt={t("nav.brand")}
            className="mb-5 h-20 w-auto bg-transparent object-contain sm:h-28"
          />
          <h1 className="font-display text-[24px] font-bold tracking-tight text-white sm:text-[28px]">
            {t("login.resetTitle")}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            {t("login.resetSubtitle")}
          </p>
        </div>

        <div className="mb-6 h-px bg-white/10" />

        {!canReset ? (
          <div className="space-y-4">
            <p className="text-[13px] text-danger">
              {linkError ?? t("login.resetLinkInvalid")}
            </p>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center bg-accent text-[14px] font-semibold text-black"
            >
              {t("login.backToSignIn")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                {t("settings.newPassword")}
              </span>
              <span className="relative block">
                <KeyIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
                <PasswordInput
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  inputClassName="h-11 w-full border border-white/15 bg-[#0f0f0f] pl-10 text-[13px] text-foreground outline-none placeholder:text-muted/70 focus:border-accent/60"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                {t("settings.confirmPassword")}
              </span>
              <span className="relative block">
                <KeyIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
                <PasswordInput
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  inputClassName="h-11 w-full border border-white/15 bg-[#0f0f0f] pl-10 text-[13px] text-foreground outline-none placeholder:text-muted/70 focus:border-accent/60"
                />
              </span>
            </label>

            {error ? (
              <p className="text-[12px] text-danger">{error}</p>
            ) : null}
            {message ? (
              <p className="text-[12px] text-success">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 bg-accent text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? t("common.loading") : t("login.resetSubmit")}
              {!loading ? <LoginArrowIcon className="size-4" /> : null}
            </button>
          </div>
        )}
      </div>

      <div className="flex h-1 w-full bg-white/10">
        <span className="h-full w-1/3 bg-accent" />
      </div>
    </form>
  );
}

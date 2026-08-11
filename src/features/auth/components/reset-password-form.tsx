"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { updatePassword } from "@/features/auth/api/auth";
import { createClient } from "@/lib/supabase/client";
import { KeyIcon, LoginArrowIcon } from "@/shared/components/icons";
import { PasswordInput } from "@/shared/components/password-input";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";

const TOKEN_KEY = "password_reset_token_hash";

/** Deduplicate Strict Mode / remount so verifyOtp runs once per token. */
let recoveryBootstrap: {
  token: string;
  promise: Promise<{ ok: true } | { ok: false; error: string }>;
} | null = null;

async function establishRecoverySession(
  invalidMessage: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const existing = await supabase.auth.getSession();
  if (existing.data.session) {
    return { ok: true };
  }

  const url = new URL(window.location.href);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  if (hashParams.get("error")) {
    return {
      ok: false,
      error:
        hashParams.get("error_description")?.replaceAll("+", " ") ||
        invalidMessage,
    };
  }

  const code = url.searchParams.get("code");
  if (code) {
    const cacheKey = `code:${code}`;
    if (recoveryBootstrap?.token === cacheKey) {
      return recoveryBootstrap.promise;
    }
    const promise = (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      window.history.replaceState({}, "", "/reset-password");
      if (error) return { ok: false as const, error: invalidMessage };
      return { ok: true as const };
    })();
    recoveryBootstrap = { token: cacheKey, promise };
    return promise;
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken) {
    const cacheKey = `hash:${accessToken}`;
    if (recoveryBootstrap?.token === cacheKey) {
      return recoveryBootstrap.promise;
    }
    const promise = (async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      window.history.replaceState({}, "", "/reset-password");
      if (error) return { ok: false as const, error: invalidMessage };
      return { ok: true as const };
    })();
    recoveryBootstrap = { token: cacheKey, promise };
    return promise;
  }

  const tokenHash =
    url.searchParams.get("token_hash") || sessionStorage.getItem(TOKEN_KEY);
  const type = (url.searchParams.get("type") || "recovery") as EmailOtpType;

  if (!tokenHash) {
    return { ok: false, error: invalidMessage };
  }

  if (url.searchParams.get("token_hash")) {
    sessionStorage.setItem(TOKEN_KEY, tokenHash);
  }

  if (recoveryBootstrap?.token === tokenHash) {
    return recoveryBootstrap.promise;
  }

  const promise = (async () => {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    window.history.replaceState({}, "", "/reset-password");
    if (error) {
      return { ok: false as const, error: invalidMessage };
    }
    sessionStorage.removeItem(TOKEN_KEY);
    return { ok: true as const };
  })();

  recoveryBootstrap = { token: tokenHash, promise };
  return promise;
}

/**
 * Email link establishes a recovery session on load (verifyOtp / code / hash).
 * Submit only calls updateUser({ password }) on that session — no reset API.
 */
export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const submitting = useRef(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await establishRecoverySession(t("login.resetLinkInvalid"));
      if (cancelled) return;
      if (!result.ok) {
        setLinkError(result.error);
        setSessionReady(false);
      } else {
        setSessionReady(true);
        setLinkError(null);
      }
      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
    // Bootstrap once on mount; session check covers remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !sessionReady) return;
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError(t("login.resetPasswordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("settings.passwordMismatch"));
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(t("settings.passwordUpdateFailed"));
        submitting.current = false;
        setLoading(false);
        return;
      }

      setMessage(t("settings.passwordUpdated"));
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      setError(t("settings.passwordUpdateFailed"));
      submitting.current = false;
      setLoading(false);
    }
  }

  const canReset = sessionReady && !linkError && !bootstrapping;

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

        {bootstrapping ? (
          <p className="text-center text-[13px] text-muted">
            {t("common.loading")}
          </p>
        ) : !canReset ? (
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
                  minLength={6}
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
                  minLength={6}
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

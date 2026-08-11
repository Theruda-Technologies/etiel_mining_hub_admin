"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  KeyIcon,
  LoginArrowIcon,
  UserIcon,
} from "@/shared/components/icons";
import { PasswordInput } from "@/shared/components/password-input";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";

type Mode = "signin" | "forgot";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: { role: string };
      };

      if (!response.ok) {
        setError(data.error ?? t("login.authFailed"));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("login.authUnreachable"));
      setLoading(false);
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? t("login.forgotFailed"));
        setLoading(false);
        return;
      }

      setMessage(data.message ?? t("login.forgotSent"));
      setLoading(false);
    } catch {
      setError(t("login.authUnreachable"));
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={mode === "signin" ? handleSignIn : handleForgot}
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
            {mode === "signin" ? t("login.title") : t("login.forgotTitle")}
          </h1>
          {mode === "forgot" ? (
            <p className="mt-2 text-[13px] text-muted">
              {t("login.forgotSubtitle")}
            </p>
          ) : null}
        </div>

        <div className="mb-6 h-px bg-white/10" />

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              {t("login.email")}
            </span>
            <span className="relative block">
              <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@etiel.mining"
                className="h-11 w-full border border-white/15 bg-[#0f0f0f] pr-3 pl-10 text-[13px] text-foreground outline-none placeholder:text-muted/70 focus:border-accent/60"
              />
            </span>
          </label>

          {mode === "signin" ? (
            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                <span>{t("login.password")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setMessage(null);
                  }}
                  className="normal-case tracking-normal text-accent hover:underline"
                >
                  {t("login.forgotPassword")}
                </button>
              </span>
              <span className="relative block">
                <KeyIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  inputClassName="h-11 w-full border border-white/15 bg-[#0f0f0f] pl-10 text-[13px] text-foreground outline-none placeholder:text-muted/70 focus:border-accent/60"
                />
              </span>
            </label>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 text-[12px] text-danger">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-4 text-[12px] text-success">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 bg-accent text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading
            ? t("common.loading")
            : mode === "signin"
              ? t("login.submit")
              : t("login.forgotSubmit")}
          {!loading && mode === "signin" ? (
            <LoginArrowIcon className="size-4" />
          ) : null}
        </button>

        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setMessage(null);
            }}
            className="mt-4 w-full text-center text-[13px] text-muted hover:text-accent"
          >
            {t("login.backToSignIn")}
          </button>
        ) : null}
      </div>

      <div className="flex h-1 w-full bg-white/10">
        <span className="h-full w-1/3 bg-accent" />
      </div>
    </form>
  );
}

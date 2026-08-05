"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  KeyIcon,
  LoginArrowIcon,
  ShieldIcon,
  UserIcon,
} from "@/shared/components/icons";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
        setError(data.error ?? "Authentication failed.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach auth service.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-[400px] overflow-hidden border border-white/10 bg-[#141414]/95 shadow-2xl backdrop-blur-sm"
    >
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="px-8 pt-10 pb-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <ShieldIcon className="mb-4 size-8 text-accent" />
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">
            {t("login.title")}
          </h1>
          <p className="mt-2 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            {t("nav.brand")}
          </p>
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

          <label className="block">
            <span className="mb-2 block font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              {t("login.password")}
            </span>
            <span className="relative block">
              <KeyIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full border border-white/15 bg-[#0f0f0f] pr-3 pl-10 text-[13px] text-foreground outline-none placeholder:text-muted/70 focus:border-accent/60"
              />
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-[12px] text-danger">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 bg-accent text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("login.submit")}
          {!loading ? <LoginArrowIcon className="size-4" /> : null}
        </button>
      </div>

      <div className="flex h-1 w-full bg-white/10">
        <span className="h-full w-1/3 bg-accent" />
      </div>
    </form>
  );
}

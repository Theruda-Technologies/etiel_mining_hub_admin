import { createClient } from "@/lib/supabase/client";
import type { LoginCredentials } from "../types";

export async function signInWithPassword({ email, password }: LoginCredentials) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

/** Update password for the current (recovery) session. */
export async function updatePassword(password: string) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password });
}

/** Request a password reset email (Resend via our API + Supabase recovery link). */
export async function resetPassword(email: string) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    return {
      error: data.error ?? "Could not send password reset email.",
      message: undefined as string | undefined,
    };
  }

  return {
    error: undefined as string | undefined,
    message:
      data.message ??
      "If that email is registered, a password reset link has been sent.",
  };
}

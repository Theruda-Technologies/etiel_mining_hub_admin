"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../types";

async function fetchSession() {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: AuthSession | null };
  return data.user ?? null;
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    function load() {
      fetchSession()
        .then((session) => {
          if (!active) return;
          setUser(session);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setUser(null);
          setLoading(false);
        });
    }

    load();
    window.addEventListener("auth-profile-updated", load);
    return () => {
      active = false;
      window.removeEventListener("auth-profile-updated", load);
    };
  }, []);

  return { user, loading };
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "../types";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const current = data.user;
      setUser(
        current
          ? { id: current.id, email: current.email ?? "" }
          : null,
      );
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(
        current
          ? { id: current.id, email: current.email ?? "" }
          : null,
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

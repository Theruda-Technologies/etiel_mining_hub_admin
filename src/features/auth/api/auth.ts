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

import type { AdminUser } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }));
}

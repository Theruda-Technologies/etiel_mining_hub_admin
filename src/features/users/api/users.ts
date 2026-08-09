import type { AdminUser } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const avatarById = new Map(
    (authUsers?.users ?? []).map((u) => [
      u.id,
      (typeof u.user_metadata?.avatar_url === "string"
        ? u.user_metadata.avatar_url
        : null) as string | null,
    ]),
  );

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? row.email,
    role: row.role,
    createdAt: row.created_at,
    avatarUrl: avatarById.get(row.id) ?? null,
  }));
}

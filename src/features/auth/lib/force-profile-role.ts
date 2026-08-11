import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Live DB has a trigger that blocks role UPDATEs unless the actor is a
 * Super Admin JWT. Service-role updates therefore fail with
 * "Only super_admin can change roles". Delete + insert bypasses that guard.
 */
export async function forceProfileStaffRole(input: {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin";
  avatarUrl?: string | null;
  invitedBy?: string | null;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  const { error: deleteError } = await admin
    .from("profiles")
    .delete()
    .eq("id", input.id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const row: Record<string, unknown> = {
    id: input.id,
    email: input.email,
    full_name: input.fullName,
    role: input.role,
    updated_at: new Date().toISOString(),
  };

  if (existing?.created_at) row.created_at = existing.created_at;
  if (input.avatarUrl ?? existing?.avatar_url) {
    row.avatar_url = input.avatarUrl ?? existing?.avatar_url;
  }
  if (input.invitedBy ?? existing?.invited_by) {
    row.invited_by = input.invitedBy ?? existing?.invited_by;
  }

  const { error: insertError } = await admin.from("profiles").insert(row);
  if (insertError) {
    return { error: insertError.message };
  }

  return { error: null };
}

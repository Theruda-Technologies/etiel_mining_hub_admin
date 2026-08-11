import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRole, type AuthSession, type UserRole } from "../types";

export async function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookies may be read-only here.
        }
      },
    },
  });
}

function resolveRole(
  appRole: unknown,
  profileRole: unknown,
  metaRole: unknown,
): UserRole | null {
  // Prefer auth app_metadata so Super Admin works even if profile.role is stale.
  if (appRole === "super_admin" || appRole === "admin") {
    return parseRole(appRole);
  }
  if (profileRole === "super_admin" || profileRole === "admin") {
    return parseRole(profileRole);
  }
  if (metaRole === "super_admin" || metaRole === "admin") {
    return parseRole(metaRole);
  }
  if (appRole === "operator" || profileRole === "operator" || metaRole === "operator") {
    return "admin";
  }
  // Customers / unknown roles are not admin-hub staff.
  return null;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    ) {
      return null;
    }

    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    let profile: {
      full_name?: string;
      role?: string;
      email?: string;
    } | null = null;

    try {
      const result = await supabase
        .from("profiles")
        .select("full_name, role, email")
        .eq("id", user.id)
        .maybeSingle();
      profile = result.data;
    } catch {
      profile = null;
    }

    const metaStatus = user.user_metadata?.status as string | undefined;
    if (metaStatus === "suspended") {
      return null;
    }

    const avatarUrl =
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null;

    const role = resolveRole(
      user.app_metadata?.role,
      profile?.role,
      user.user_metadata?.role,
    );
    if (!role) return null;

    return {
      id: user.id,
      email: profile?.email ?? user.email ?? "",
      name:
        profile?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        (user.email?.split("@")[0] ?? "User"),
      role,
      avatarUrl,
      authenticatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (
    resolveRole(
      authUser.user?.app_metadata?.role,
      data?.role,
      authUser.user?.user_metadata?.role,
    ) ?? "admin"
  );
}

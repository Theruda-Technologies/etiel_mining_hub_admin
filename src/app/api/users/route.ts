import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireSuperAdmin } from "@/features/auth/lib/server";
import { forceProfileStaffRole } from "@/features/auth/lib/force-profile-role";
import {
  canBlockUser,
  parseProfileRole,
  parseRole,
  type UserRole,
} from "@/features/auth/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "super_admin" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusFilter = new URL(request.url).searchParams.get("status");
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const metaById = new Map(
    (authUsers?.users ?? []).map((u) => [
      u.id,
      {
        status: (u.user_metadata?.status as string | undefined) ?? "active",
        invited_by: u.user_metadata?.invited_by as string | undefined,
        avatar_url: u.user_metadata?.avatar_url as string | undefined,
        role: u.app_metadata?.role as string | undefined,
      },
    ]),
  );

  let users = (profiles ?? []).map((profile) => {
    const meta = metaById.get(profile.id);
    // Auth app_metadata wins for staff; otherwise show the profile role as-is.
    const rawRole = meta?.role || profile.role;
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: parseProfileRole(rawRole),
      status: meta?.status ?? "active",
      created_at: profile.created_at,
      invited_by: meta?.invited_by ?? null,
      avatar_url: meta?.avatar_url ?? null,
    };
  });

  if (statusFilter) {
    users = users.filter((u) => u.status === statusFilter);
  }

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    role?: "super_admin" | "admin";
    status?: "active" | "suspended" | "invited";
  };

  if (!body.id) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  if (body.id === session.id) {
    return NextResponse.json(
      { error: "You cannot change your own account status or role here." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(body.id);
  if (!authUser.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("role")
    .eq("id", body.id)
    .maybeSingle();

  const targetRole = parseProfileRole(
    authUser.user.app_metadata?.role || profileRow?.role,
  );

  // Role changes remain Super Admin only.
  if (body.role) {
    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await admin.auth.admin.updateUserById(body.id, {
      app_metadata: { ...authUser.user.app_metadata, role: body.role },
    });
    const synced = await forceProfileStaffRole({
      id: body.id,
      email: authUser.user.email ?? "",
      fullName:
        (authUser.user.user_metadata?.full_name as string | undefined) ||
        authUser.user.email?.split("@")[0] ||
        "User",
      role: body.role,
      avatarUrl:
        typeof authUser.user.user_metadata?.avatar_url === "string"
          ? authUser.user.user_metadata.avatar_url
          : null,
    });
    if (synced.error) {
      return NextResponse.json({ error: synced.error }, { status: 500 });
    }
  }

  if (body.status) {
    const isBlockAction =
      body.status === "suspended" || body.status === "active";

    if (isBlockAction) {
      if (
        session.role !== "super_admin" ||
        !canBlockUser(session.role, targetRole)
      ) {
        return NextResponse.json(
          {
            error:
              "Only a Super Admin can block or unblock Admin or Customer accounts.",
          },
          { status: 403 },
        );
      }
    } else if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await admin.auth.admin.updateUserById(body.id, {
      user_metadata: {
        ...authUser.user.user_metadata,
        status: body.status,
      },
      ban_duration: body.status === "suspended" ? "876000h" : "none",
    });
  }

  return NextResponse.json({
    user: {
      id: body.id,
      role: body.role ?? parseRole(authUser.user.app_metadata?.role),
      status:
        body.status ??
        (authUser.user.user_metadata?.status as string | undefined) ??
        "active",
    },
  });
}

export async function DELETE(request: Request) {
  try {
    await requireSuperAdmin();
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(body.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await admin.from("profiles").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to revoke invite.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

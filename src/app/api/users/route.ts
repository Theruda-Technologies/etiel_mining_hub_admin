import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireSuperAdmin } from "@/features/auth/lib/server";
import { parseRole } from "@/features/auth/types";

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
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: parseRole(meta?.role ?? profile.role),
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
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    role?: "super_admin" | "admin";
    status?: "active" | "suspended" | "invited";
  };

  if (!body.id) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(body.id);
  if (!authUser.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (body.role) {
    await admin.auth.admin.updateUserById(body.id, {
      app_metadata: { ...authUser.user.app_metadata, role: body.role },
    });
    // Profile role updates may be blocked by DB trigger; auth metadata is source of truth.
    await admin
      .from("profiles")
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq("id", body.id);
  }

  if (body.status) {
    await admin.auth.admin.updateUserById(body.id, {
      user_metadata: {
        ...authUser.user.user_metadata,
        status: body.status,
      },
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

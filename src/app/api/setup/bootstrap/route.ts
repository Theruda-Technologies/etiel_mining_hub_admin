import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-time bootstrap for the first Super Admin.
 * Requires SUPER_ADMIN_SETUP_SECRET matching the request header `x-setup-secret`.
 */
export async function POST(request: Request) {
  const setupSecret = process.env.SUPER_ADMIN_SETUP_SECRET;
  const provided = request.headers.get("x-setup-secret");

  if (!setupSecret || provided !== setupSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    fullName?: string;
  };

  const email =
    body.email?.trim().toLowerCase() ||
    process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password =
    body.password || process.env.SUPER_ADMIN_PASSWORD || "";
  const fullName = body.fullName?.trim() || "Super Admin";

  if (!email || password.length < 8) {
    return NextResponse.json(
      {
        error:
          "Provide email and password (min 8 chars), or set SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A Super Admin already exists." },
      { status: 409 },
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "super_admin" },
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create Super Admin." },
      { status: 400 },
    );
  }

  await admin.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: "admin", // live DB may block writing super_admin on profiles; auth metadata is source of truth
    updated_at: new Date().toISOString(),
  });

  await admin.auth.admin.updateUserById(data.user.id, {
    user_metadata: {
      full_name: fullName,
      avatar_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face",
      status: "active",
    },
  });

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email, role: "super_admin" },
  });
}

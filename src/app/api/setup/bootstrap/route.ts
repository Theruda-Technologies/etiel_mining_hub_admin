import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Idempotent Super Admin bootstrap.
 * Creates the user if missing, or promotes/updates an existing account.
 * Requires SUPER_ADMIN_SETUP_SECRET matching the request header `x-setup-secret`.
 */
export async function POST(request: Request) {
  const setupSecret = process.env.SUPER_ADMIN_SETUP_SECRET;
  const provided = request.headers.get("x-setup-secret");

  if (!setupSecret || provided !== setupSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
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

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  let user = listed.users.find((u) => u.email?.toLowerCase() === email);
  let created = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "super_admin" },
      user_metadata: {
        full_name: fullName,
        status: "active",
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create Super Admin." },
        { status: 400 },
      );
    }
    user = data.user;
    created = true;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: { ...user.app_metadata, role: "super_admin" },
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        status: "active",
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // profiles.role may not allow "super_admin" on the live DB; Auth app_metadata is source of truth.
  await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
    role: "admin",
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    created,
    user: { id: user.id, email, role: "super_admin" },
  });
}

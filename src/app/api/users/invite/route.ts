import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/features/auth/lib/server";
import { parseRole, type UserRole } from "@/features/auth/types";

function generatePassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      role?: string;
      password?: string;
      avatarUrl?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const fullName = body.fullName?.trim() ?? "";
    const role = parseRole(body.role);
    const avatarUrl = body.avatarUrl?.trim() || null;
    const password =
      body.password?.trim() && body.password.trim().length >= 8
        ? body.password.trim()
        : generatePassword();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Full name and institutional email are required." },
        { status: 400 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;
    const loginUrl = `${appUrl}/login`;

    const admin = createAdminClient();

    // Supabase Auth sends the invite email (built-in or project SMTP).
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: loginUrl,
      data: {
        full_name: fullName,
        invited_by: session.id,
        status: "invited",
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to invite user. Check Supabase Auth email settings.",
        },
        { status: 400 },
      );
    }

    // Role + temporary password so they can also sign in from /login.
    const { error: updateError } = await admin.auth.admin.updateUserById(
      data.user.id,
      {
        app_metadata: { role },
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          invited_by: session.id,
          status: "invited",
          ...(avatarUrl ? { avatar_url: avatarUrl } : { avatar_url: null }),
        },
      },
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 },
      );
    }

    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: role === "super_admin" ? "admin" : role,
      updated_at: new Date().toISOString(),
    });

    if (avatarUrl) {
      await admin
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", data.user.id);
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email,
        fullName,
        role: role as UserRole,
        avatarUrl,
      },
      emailSent: true,
      temporaryPassword: password,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to invite user.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

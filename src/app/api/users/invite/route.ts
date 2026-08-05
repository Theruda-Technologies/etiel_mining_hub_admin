import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/features/auth/lib/server";
import { sendInviteEmail } from "@/features/auth/lib/email";
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
    const avatarUrl =
      body.avatarUrl?.trim() ||
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face";
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

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: {
        full_name: fullName,
        invited_by: session.id,
        status: "invited",
        avatar_url: avatarUrl,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create user." },
        { status: 400 },
      );
    }

    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      // Live DB trigger may block writing super_admin onto profiles.
      role: role === "super_admin" ? "admin" : role,
      updated_at: new Date().toISOString(),
    });

    // Best-effort avatar column (optional until migration 003).
    await admin
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", data.user.id);

    const origin = new URL(request.url).origin;
    const loginUrl = `${origin}/login`;
    const emailResult = await sendInviteEmail({
      to: email,
      fullName,
      role,
      password,
      loginUrl,
    });

    return NextResponse.json({
      user: {
        id: data.user.id,
        email,
        fullName,
        role: role as UserRole,
        avatarUrl,
      },
      emailSent: emailResult.sent,
      emailReason: "reason" in emailResult ? emailResult.reason : undefined,
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

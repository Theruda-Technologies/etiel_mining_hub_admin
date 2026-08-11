import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/features/auth/lib/server";
import { type UserRole } from "@/features/auth/types";
import {
  isSmtpConfigured,
  sendInviteCredentialsEmail,
} from "@/lib/mail/send-invite-email";

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
    // Invites are always Admin; Super Admin is not assignable from the UI.
    const role: UserRole = "admin";
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

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        {
          error: [
            "Resend is required to email the invite password.",
            "Add to .env.local (or Worker secrets):",
            "SMTP_PASS=re_your_api_key",
            'SMTP_FROM="Etiel Mining Hub <noreply@admin.etielmininghub.com>"',
            "Restart the dev server after saving.",
          ].join(" "),
        },
        { status: 400 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;
    const loginUrl = `${appUrl}/login`;
    const roleLabel = "Admin";

    const admin = createAdminClient();

    // Create the Auth user (we email credentials via Resend HTTP).
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: {
        full_name: fullName,
        invited_by: session.id,
        status: "invited",
        role_label: roleLabel,
        login_url: loginUrl,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
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
      role: "admin",
      updated_at: new Date().toISOString(),
    });

    if (avatarUrl) {
      await admin
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", data.user.id);
    }

    const mail = await sendInviteCredentialsEmail({
      to: email,
      fullName,
      roleLabel,
      password,
      loginUrl,
    });

    if (!mail.sent) {
      return NextResponse.json({
        user: {
          id: data.user.id,
          email,
          fullName,
          role: role as UserRole,
          avatarUrl,
        },
        emailSent: false,
        emailReason: mail.error,
      });
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
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to invite user.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/app-url";
import { createPasswordResetToken } from "@/lib/password-reset";
import {
  isSmtpConfigured,
  sendPasswordResetEmail,
} from "@/lib/mail/send-invite-email";

/**
 * Always returns a generic success message so callers cannot probe emails.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  const generic = {
    ok: true,
    message:
      "If that email is registered, a password reset link has been sent.",
  };

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        error:
          "Password reset email is not configured. Set SMTP_PASS and SMTP_FROM.",
      },
      { status: 503 },
    );
  }

  const appUrl = getAppUrl(request);

  try {
    const admin = createAdminClient();
    const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
    const user = listed.users.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      return NextResponse.json(generic);
    }

    // App-owned token (not Supabase OTP) — email scanners cannot burn it by GET.
    const reset = createPasswordResetToken();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          password_reset_token: reset.hash,
          password_reset_expires: reset.expiresAt,
        },
      },
    );

    if (updateError) {
      console.error("forgot-password store token:", updateError.message);
      return NextResponse.json(generic);
    }

    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(reset.raw)}`;
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      email.split("@")[0];

    const mail = await sendPasswordResetEmail({
      to: email,
      fullName,
      resetUrl,
    });

    if (!mail.sent) {
      console.error("forgot-password mail:", mail.error);
    }

    return NextResponse.json(generic);
  } catch (error) {
    console.error("forgot-password:", error);
    return NextResponse.json(generic);
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/app-url";
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

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    const hashedToken = data?.properties?.hashed_token;
    if (error || !hashedToken) {
      console.error("forgot-password generateLink:", error?.message);
      return NextResponse.json(generic);
    }

    // Link straight to our app — do NOT use Supabase /auth/v1/verify
    // (that redirects to Site URL, often still localhost).
    const resetUrl =
      `${appUrl}/reset-password` +
      `?token_hash=${encodeURIComponent(hashedToken)}` +
      `&type=recovery`;

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

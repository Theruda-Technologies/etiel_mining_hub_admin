import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAppUrl,
  getPasswordResetRedirectUrl,
} from "@/lib/app-url";
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

  const redirectTo = getPasswordResetRedirectUrl(request);
  const appUrl = getAppUrl(request);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.hashed_token) {
      // Unknown email / generate failure — still look identical to success.
      if (error) {
        console.error("forgot-password generateLink:", error.message);
      }
      return NextResponse.json(generic);
    }

    // Deep-link into the app with token_hash (do not email supabase /verify —
    // GET scanners and Site URL redirects burn or mis-route that link).
    const resetUrl = `${appUrl}/reset-password?token_hash=${encodeURIComponent(
      data.properties.hashed_token,
    )}&type=recovery`;

    const fullName =
      (data.user?.user_metadata?.full_name as string | undefined) ||
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

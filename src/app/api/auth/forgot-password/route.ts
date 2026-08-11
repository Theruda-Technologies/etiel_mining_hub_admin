import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;
  const redirectTo = `${appUrl}/reset-password`;

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
      options: { redirectTo },
    });

    if (error || !data.properties?.action_link) {
      console.error("forgot-password generateLink:", error?.message);
      return NextResponse.json(generic);
    }

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      email.split("@")[0];

    const mail = await sendPasswordResetEmail({
      to: email,
      fullName,
      resetUrl: data.properties.action_link,
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

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/features/auth/lib/server";
import {
  getInviteEmailTemplateHtml,
  INVITE_EMAIL_SUBJECT,
  syncInviteEmailTemplate,
} from "@/lib/supabase/invite-email-template";

/** Sync or return the Invite email template (includes password). */
export async function POST() {
  try {
    await requireSuperAdmin();
    const result = await syncInviteEmailTemplate();
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          subject: INVITE_EMAIL_SUBJECT,
          html: getInviteEmailTemplateHtml(),
          hint: "Paste the returned html into Supabase → Authentication → Emails → Invite user.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      subject: INVITE_EMAIL_SUBJECT,
      message: "Invite email template synced (includes password).",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync template.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    await requireSuperAdmin();
    return NextResponse.json({
      subject: INVITE_EMAIL_SUBJECT,
      html: getInviteEmailTemplateHtml(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unauthorized";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

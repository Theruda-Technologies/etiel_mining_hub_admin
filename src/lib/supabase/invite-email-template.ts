import { readFileSync } from "fs";
import { join } from "path";

/** HTML body for Supabase Auth “Invite user” template (includes password). */
export function getInviteEmailTemplateHtml(): string {
  try {
    return readFileSync(
      join(process.cwd(), "supabase/email-templates/invite-user.html"),
      "utf8",
    )
      .replace(/^<!--[\s\S]*?-->\s*/m, "")
      .trim();
  } catch {
    return [
      "<h2>Etiel Mining Hub access</h2>",
      "<p>Hello {{ .Data.full_name }},</p>",
      "<p>You have been invited as <strong>{{ .Data.role_label }}</strong>.</p>",
      '<p><strong>Login URL:</strong> <a href="{{ .Data.login_url }}">{{ .Data.login_url }}</a></p>',
      "<p><strong>Email:</strong> {{ .Email }}</p>",
      "<p><strong>Password:</strong> {{ .Data.password }}</p>",
      "<p><a href=\"{{ .ConfirmationURL }}\">Accept invitation</a></p>",
    ].join("\n");
  }
}

export const INVITE_EMAIL_SUBJECT = "Your Etiel Mining Hub access credentials";

/**
 * Pushes the invite email template (with password) to the hosted Supabase project.
 * Requires SUPABASE_ACCESS_TOKEN (Account → Access Tokens) and project ref from URL.
 */
export async function syncInviteEmailTemplate(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!token) {
    return {
      ok: false,
      error:
        "SUPABASE_ACCESS_TOKEN is not set. Paste invite-user.html into Authentication → Emails → Invite user, or add an access token to sync automatically.",
    };
  }
  if (!ref) {
    return { ok: false, error: "Could not resolve Supabase project ref." };
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_subjects_invite: INVITE_EMAIL_SUBJECT,
        mailer_templates_invite_content: getInviteEmailTemplateHtml(),
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      error: `Failed to sync invite template (${res.status}): ${text.slice(0, 200)}`,
    };
  }

  return { ok: true };
}

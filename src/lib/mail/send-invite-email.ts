export type InviteMailInput = {
  to: string;
  fullName: string;
  roleLabel: string;
  password: string;
  loginUrl: string;
};

function resendApiKey() {
  return (
    process.env.RESEND_API_KEY?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    ""
  );
}

function fromAddress() {
  const raw =
    process.env.SMTP_FROM?.trim() || process.env.RESEND_FROM?.trim() || "";
  // Vercel/dashboard env values are often pasted with wrapping quotes.
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

/** Invite mail uses Resend HTTP (Workers-compatible; no SMTP sockets). */
export function isSmtpConfigured() {
  return Boolean(resendApiKey() && fromAddress());
}

function missingConfigMessage() {
  return [
    "Resend is not configured. Add to .env.local (or Worker secrets):",
    "SMTP_PASS=re_your_api_key   (or RESEND_API_KEY)",
    'SMTP_FROM="Etiel Mining Hub <noreply@admin.etielmininghub.com>"',
    "Free signup: https://resend.com",
  ].join(" ");
}

export async function sendInviteCredentialsEmail(
  input: InviteMailInput,
): Promise<{ sent: true } | { sent: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { sent: false, error: missingConfigMessage() };
  }

  const apiKey = resendApiKey();
  const from = fromAddress();

  const subject = "Your Etiel Mining Hub access credentials";
  const text = [
    `Hello ${input.fullName},`,
    "",
    `You have been invited as ${input.roleLabel} to the Etiel Mining Hub Operational Center.`,
    "",
    `Login URL: ${input.loginUrl}`,
    `Email: ${input.to}`,
    `Password: ${input.password}`,
    "",
    "Sign in with the email and password above, then change your password in System Settings.",
    "",
    "© Etiel Mining Hub Operational Center",
  ].join("\n");

  const html = `
<h2>Etiel Mining Hub access</h2>
<p>Hello ${escapeHtml(input.fullName)},</p>
<p>
  You have been invited as
  <strong>${escapeHtml(input.roleLabel)}</strong>
  to the Etiel Mining Hub Operational Center.
</p>
<p><strong>Login URL:</strong> <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a></p>
<p><strong>Email:</strong> ${escapeHtml(input.to)}</p>
<p><strong>Password:</strong> <code>${escapeHtml(input.password)}</code></p>
<p>
  Sign in with the email and password above, then change your password
  in System Settings.
</p>
<p style="color:#666;font-size:12px;">© Etiel Mining Hub Operational Center</p>
`.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      return {
        sent: false,
        error: body?.message ?? `Resend error (${res.status})`,
      };
    }

    return { sent: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite email.";
    return { sent: false, error: message };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

import nodemailer from "nodemailer";

export type InviteMailInput = {
  to: string;
  fullName: string;
  roleLabel: string;
  password: string;
  loginUrl: string;
};

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim(),
  );
}

function smtpMissingMessage() {
  return [
    "SMTP is not configured. Add these to .env.local (Resend example):",
    "SMTP_HOST=smtp.resend.com",
    "SMTP_PORT=465",
    "SMTP_USER=resend",
    "SMTP_PASS=re_your_api_key",
    "SMTP_FROM=\"Etiel Mining Hub <onboarding@resend.dev>\"",
    "Then restart npm run dev. Free signup: https://resend.com",
  ].join(" ");
}

export async function sendInviteCredentialsEmail(
  input: InviteMailInput,
): Promise<{ sent: true } | { sent: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { sent: false, error: smtpMissingMessage() };
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from = process.env.SMTP_FROM!.trim();
  const secure =
    process.env.SMTP_SECURE?.trim() === "true" ||
    port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

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
    await transporter.sendMail({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
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

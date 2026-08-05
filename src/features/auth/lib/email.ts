type InviteEmailPayload = {
  to: string;
  fullName: string;
  role: string;
  password: string;
  loginUrl: string;
};

export async function sendInviteEmail(payload: InviteEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVITE_FROM_EMAIL ??
    "Etiel Mining Hub <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      sent: false as const,
      reason:
        "RESEND_API_KEY is not configured. Share the temporary password securely with the user.",
    };
  }

  const roleLabel =
    payload.role === "super_admin" ? "Super Admin" : "Admin";
  const html = `
    <div style="font-family: sans-serif; color: #111; line-height: 1.5;">
      <h2>Etiel Mining Hub access</h2>
      <p>Hello ${payload.fullName},</p>
      <p>
        A Super Administrator has created your <strong>${roleLabel}</strong>
        account for the Etiel Mining Hub Operational Center.
      </p>
      <p><strong>Login URL:</strong> <a href="${payload.loginUrl}">${payload.loginUrl}</a></p>
      <p><strong>Operator ID / Email:</strong> ${payload.to}</p>
      <p><strong>Temporary Access Code:</strong> ${payload.password}</p>
      <p>Sign in with these credentials, then update your password in System Settings.</p>
      <p style="color:#666;font-size:12px;">© Etiel Mining Hub Operational Center</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: "Your Etiel Mining Hub access credentials",
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      sent: false as const,
      reason: `Invite email failed: ${detail}`,
    };
  }

  return { sent: true as const };
}

/**
 * Public origin for invite/reset links.
 * Prefer NEXT_PUBLIC_APP_URL; never let local Site URL leak into production emails.
 */
export function getAppUrl(request?: Request): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const fromEnv = raw
    ? raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`
    : "";

  if (fromEnv && !isLocalHost(fromEnv)) {
    return fromEnv;
  }

  if (request) {
    try {
      const origin = new URL(request.url).origin.replace(/\/$/, "");
      if (!isLocalHost(origin)) return origin;
    } catch {
      // ignore
    }
  }

  if (fromEnv) return fromEnv;

  return "https://admin.etielmininghub.com";
}

export function getPasswordResetRedirectUrl(request?: Request): string {
  return `${getAppUrl(request)}/reset-password`;
}

/** Ensure Supabase verify links land on our app, not localhost Site URL. */
export function withRedirectTo(actionLink: string, redirectTo: string): string {
  try {
    const url = new URL(actionLink);
    url.searchParams.set("redirect_to", redirectTo);
    return url.toString();
  } catch {
    return actionLink;
  }
}

function isLocalHost(value: string) {
  return (
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("0.0.0.0")
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Consumes a recovery token_hash once, then sets the password via service role.
 * Client-side verifyOtp is avoided (double-submit races burn the OTP).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token_hash?: string;
    password?: string;
  };

  const tokenHash = body.token_hash?.trim() ?? "";
  const password = body.password ?? "";

  if (!tokenHash || password.length < 8) {
    return NextResponse.json(
      { error: "A valid reset token and password (min 8 chars) are required." },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Auth is not configured." },
      { status: 500 },
    );
  }

  const auth = createClient(url, anon, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: verified, error: verifyError } = await auth.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (verifyError || !verified.user) {
    return NextResponse.json(
      {
        error:
          verifyError?.message ??
          "This reset link is invalid or has expired.",
      },
      { status: 400 },
    );
  }

  const meta = verified.user.user_metadata ?? {};
  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(
    verified.user.id,
    {
      password,
      user_metadata: {
        ...meta,
        status: meta.status === "invited" ? "active" : meta.status,
        temporary_password: null,
        password: null,
      },
    },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Drop the short-lived recovery session created by verifyOtp.
  await auth.auth.signOut();

  return NextResponse.json({ ok: true });
}

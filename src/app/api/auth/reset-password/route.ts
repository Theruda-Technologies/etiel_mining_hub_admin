import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashPasswordResetToken,
  isPasswordResetExpired,
} from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    password?: string;
  };

  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";

  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "A valid reset token and password (min 8 chars) are required." },
      { status: 400 },
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const admin = createAdminClient();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const user = listed.users.find(
    (u) => u.user_metadata?.password_reset_token === tokenHash,
  );

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  if (isPasswordResetExpired(user.user_metadata?.password_reset_expires)) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    {
      password,
      user_metadata: {
        ...user.user_metadata,
        password_reset_token: null,
        password_reset_expires: null,
        status:
          user.user_metadata?.status === "invited"
            ? "active"
            : user.user_metadata?.status,
      },
    },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

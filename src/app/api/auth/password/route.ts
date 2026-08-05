import { NextResponse } from "next/server";
import { createAuthClient, getSession } from "@/features/auth/lib/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Provide current password and a new password (min 8 chars)." },
      { status: 400 },
    );
  }

  const supabase = await createAuthClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: session.email,
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import {
  createAuthClient,
  getSession,
} from "@/features/auth/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    fullName?: string;
    avatarUrl?: string | null;
  };

  const fullName = body.fullName?.trim();
  const avatarUrl =
    body.avatarUrl === null
      ? null
      : body.avatarUrl?.trim()
        ? body.avatarUrl.trim()
        : undefined;

  if (fullName !== undefined && fullName.length < 2) {
    return NextResponse.json(
      { error: "Full name must be at least 2 characters." },
      { status: 400 },
    );
  }

  if (
    avatarUrl !== undefined &&
    avatarUrl !== null &&
    !/^https?:\/\//i.test(avatarUrl)
  ) {
    return NextResponse.json(
      { error: "Avatar URL must start with http:// or https://" },
      { status: 400 },
    );
  }

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nextMeta = {
    ...user.user_metadata,
    ...(fullName !== undefined ? { full_name: fullName } : {}),
    ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
  };

  const { error: authError } = await supabase.auth.updateUser({
    data: nextMeta,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const admin = createAdminClient();
  if (fullName !== undefined) {
    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  // Best-effort profiles.avatar_url (optional until migration 003).
  if (avatarUrl !== undefined) {
    await admin
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  return NextResponse.json({
    ok: true,
    user: {
      ...session,
      name: fullName ?? session.name,
      avatarUrl: avatarUrl === undefined ? session.avatarUrl : avatarUrl,
    },
  });
}

import { NextResponse } from "next/server";
import { createAuthClient } from "@/features/auth/lib/server";
import { parseRole } from "@/features/auth/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Operator ID and access code are required." },
      { status: 400 },
    );
  }

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Invalid credentials. Check operator ID and access code." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", data.user.id)
    .maybeSingle();

  const metaStatus = data.user.user_metadata?.status as string | undefined;
  if (metaStatus === "suspended") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account has been suspended." },
      { status: 403 },
    );
  }

  if (metaStatus === "invited") {
    await supabase.auth.updateUser({
      data: {
        ...data.user.user_metadata,
        status: "active",
        temporary_password: null,
        password: null,
      },
    });
  }

  const avatarUrl =
    typeof data.user.user_metadata?.avatar_url === "string"
      ? data.user.user_metadata.avatar_url
      : null;

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: profile?.email ?? data.user.email,
      name:
        profile?.full_name ??
        data.user.user_metadata?.full_name ??
        email.split("@")[0],
      role: parseRole(
        data.user.app_metadata?.role ??
          profile?.role ??
          data.user.user_metadata?.role,
      ),
      avatarUrl,
    },
  });
}

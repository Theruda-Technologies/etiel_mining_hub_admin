import { NextResponse } from "next/server";
import { createAuthClient } from "@/features/auth/lib/server";

export async function POST() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

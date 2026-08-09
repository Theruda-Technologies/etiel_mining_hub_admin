import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import { clearAdvertisement } from "@/features/products/api/catalog";

export async function DELETE() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "admin" && session.role !== "super_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await clearAdvertisement();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to clear advertisement.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import { updateOrderStatus } from "@/features/orders";
import type { OrderStatus } from "@/features/orders";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: OrderStatus;
    notes?: string;
  };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await updateOrderStatus(
    body.id,
    body.status,
    body.notes ?? "",
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

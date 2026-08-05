import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import { deleteProduct, updateProduct } from "@/features/products/api/catalog";
import type { CatalogProduct } from "@/features/products/data/catalog";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    patch?: Partial<CatalogProduct>;
  };
  if (!body.id || !body.patch) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await updateProduct(body.id, body.patch);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await deleteProduct(body.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

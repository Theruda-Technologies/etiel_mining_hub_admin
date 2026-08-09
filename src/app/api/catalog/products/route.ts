import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/features/products/api/catalog";
import type { CatalogProduct } from "@/features/products/data/catalog";
import { isValidCategory } from "@/features/products/data/categories.server";

function assertStaff(session: Awaited<ReturnType<typeof getSession>>) {
  return (
    session &&
    (session.role === "admin" || session.role === "super_admin")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!assertStaff(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    title?: string;
    sku?: string;
    category?: string;
    description?: string;
    status?: "Active" | "Draft";
    images?: string[];
    specs?: CatalogProduct["specs"];
    advertised?: boolean;
  };

  if (!body.title?.trim() || !body.sku?.trim()) {
    return NextResponse.json(
      { error: "Title and SKU are required." },
      { status: 400 },
    );
  }
  if (!body.category || !(await isValidCategory("product", body.category))) {
    return NextResponse.json(
      { error: "A valid product category is required." },
      { status: 400 },
    );
  }

  const { data, error } = await createProduct({
    title: body.title,
    sku: body.sku,
    category: body.category.trim(),
    description: body.description,
    status: body.status,
    images: body.images,
    specs: body.specs,
    advertised: body.advertised,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!assertStaff(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    patch?: Partial<CatalogProduct>;
  };
  if (!body.id || !body.patch) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (
    body.patch.category !== undefined &&
    !(await isValidCategory("product", body.patch.category))
  ) {
    return NextResponse.json(
      { error: "A valid product category is required." },
      { status: 400 },
    );
  }

  const { error } = await updateProduct(body.id, body.patch);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!assertStaff(session)) {
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

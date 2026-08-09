import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import { listCatalogCategories } from "@/features/products/data/categories.server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kind = new URL(request.url).searchParams.get("kind");
  const categories = await listCatalogCategories(
    kind === "product" || kind === "service" ? kind : undefined,
  );

  return NextResponse.json({ categories });
}

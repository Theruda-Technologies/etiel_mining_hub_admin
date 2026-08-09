import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Applies catalog category seed rows when the table already exists.
 * Create the table first by running supabase/migrations/007_catalog_categories_table.sql
 * in the Supabase SQL editor (or set DATABASE_URL and use scripts/apply-categories.mjs).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-secret");
  if (
    !secret ||
    secret !== process.env.SUPER_ADMIN_SETUP_SECRET
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error: probeError } = await admin
    .from("catalog_categories")
    .select("id")
    .limit(1);

  if (probeError) {
    const sqlPath = path.join(
      process.cwd(),
      "supabase/migrations/007_catalog_categories_table.sql",
    );
    const sql = await readFile(sqlPath, "utf8");
    return NextResponse.json(
      {
        error:
          "catalog_categories table is missing. Run the SQL below in the Supabase SQL Editor, then retry this endpoint.",
        sql,
      },
      { status: 409 },
    );
  }

  const rows = [
    {
      kind: "product",
      value: "metal_detectors",
      label: "Metal Detectors",
      label_am: "የብረት መፈለጊያዎች",
      sort_order: 1,
    },
    {
      kind: "product",
      value: "ground_scanners",
      label: "Ground Scanners",
      label_am: "የመሬት ስካነሮች",
      sort_order: 2,
    },
    {
      kind: "product",
      value: "drilling",
      label: "Drilling",
      label_am: "ቁፋሮ",
      sort_order: 3,
    },
    {
      kind: "product",
      value: "excavators",
      label: "Excavators",
      label_am: "ቆፋሪዎች",
      sort_order: 4,
    },
    {
      kind: "product",
      value: "mining_supplies",
      label: "Mining Supplies",
      label_am: "የማዕድን አቅርቦቶች",
      sort_order: 5,
    },
    {
      kind: "service",
      value: "training",
      label: "Training",
      label_am: "ስልጠና",
      sort_order: 1,
    },
    {
      kind: "service",
      value: "field_support",
      label: "Field Support",
      label_am: "የመስክ ድጋፍ",
      sort_order: 2,
    },
    {
      kind: "service",
      value: "on_site_assembly",
      label: "On-Site Assembly",
      label_am: "በቦታው ላይ ስብሰባ",
      sort_order: 3,
    },
    {
      kind: "service",
      value: "financing",
      label: "Financing",
      label_am: "ፋይናንስ",
      sort_order: 4,
    },
  ];

  const { data, error } = await admin
    .from("catalog_categories")
    .upsert(rows, { onConflict: "kind,value" })
    .select("kind, value, label");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, categories: data });
}

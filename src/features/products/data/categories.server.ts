import { createAuthClient } from "@/features/auth/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fallbackCategories,
  type CatalogCategory,
  type CatalogCategoryKind,
} from "./categories";

function mapRow(row: Record<string, unknown>): CatalogCategory {
  return {
    id: String(row.id),
    kind: row.kind === "service" ? "service" : "product",
    value: String(row.value ?? ""),
    label: String(row.label ?? row.value ?? ""),
    labelAm:
      typeof row.label_am === "string" && row.label_am.trim()
        ? row.label_am
        : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listCatalogCategories(
  kind?: CatalogCategoryKind,
): Promise<CatalogCategory[]> {
  const supabase = await createAuthClient();
  let query = supabase
    .from("catalog_categories")
    .select("id, kind, value, label, label_am, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("value", { ascending: true });

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error || !data) {
    return fallbackCategories(kind);
  }

  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function listProductCategories(): Promise<CatalogCategory[]> {
  return listCatalogCategories("product");
}

export async function listServiceCategories(): Promise<CatalogCategory[]> {
  return listCatalogCategories("service");
}

export async function isValidCategory(
  kind: CatalogCategoryKind,
  value: string,
): Promise<boolean> {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("catalog_categories")
    .select("id")
    .eq("kind", kind)
    .eq("value", trimmed)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return fallbackCategories(kind).some((c) => c.value === trimmed);
  }

  return Boolean(data);
}

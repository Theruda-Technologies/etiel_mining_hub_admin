import { createAuthClient } from "@/features/auth/lib/server";
import type {
  CatalogProduct,
  CatalogService,
  CatalogStatus,
  SpecRow,
} from "../data/catalog";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function mapActive(isActive: boolean | null | undefined): CatalogStatus {
  return isActive ? "Active" : "Draft";
}

function specsToRows(specs: unknown): SpecRow[] {
  if (Array.isArray(specs)) {
    return specs.map((entry, index) => {
      if (entry && typeof entry === "object") {
        const row = entry as Record<string, unknown>;
        return {
          id: String(row.id ?? index + 1),
          key: String(row.key ?? row.name ?? ""),
          value: String(row.value ?? ""),
        };
      }
      return { id: String(index + 1), key: "", value: String(entry ?? "") };
    });
  }
  if (specs && typeof specs === "object") {
    return Object.entries(specs as Record<string, unknown>).map(
      ([key, value], index) => ({
        id: String(index + 1),
        key,
        value: String(value ?? ""),
      }),
    );
  }
  return [];
}

function rowsToSpecs(rows: SpecRow[]) {
  return rows
    .filter((row) => row.key.trim() || row.value.trim())
    .map((row) => ({ key: row.key, value: row.value }));
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.name,
    sku: row.sku,
    status: mapActive(row.is_active),
    image: Array.isArray(row.image_paths) ? row.image_paths[0] : undefined,
    description: row.description ?? "",
    specs: specsToRows(row.specs),
  }));
}

export async function listServices(): Promise<CatalogService[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const specs = specsToRows(row.specs);
    const iconSpec = specs.find((s) => s.key.toLowerCase() === "icon");

    return {
      id: row.id,
      title: row.name,
      status: mapActive(row.is_active),
      icon: iconSpec?.value === "gradcap" ? "gradcap" : "headset",
    };
  });
}

export async function updateProduct(
  id: string,
  patch: Partial<CatalogProduct>,
) {
  const supabase = await createAuthClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) {
    updates.name = patch.title;
    updates.slug = slugify(patch.title);
  }
  if (patch.sku !== undefined) updates.sku = patch.sku;
  if (patch.status !== undefined) updates.is_active = patch.status === "Active";
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.specs !== undefined) updates.specs = rowsToSpecs(patch.specs);
  if (patch.image !== undefined) {
    updates.image_paths = patch.image ? [patch.image] : [];
  }

  return supabase.from("products").update(updates).eq("id", id);
}

export async function deleteProduct(id: string) {
  const supabase = await createAuthClient();
  return supabase.from("products").delete().eq("id", id);
}

export async function updateService(
  id: string,
  patch: Partial<CatalogService>,
) {
  const supabase = await createAuthClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) {
    updates.name = patch.title;
    updates.slug = slugify(patch.title);
  }
  if (patch.status !== undefined) updates.is_active = patch.status === "Active";

  if (patch.icon !== undefined) {
    const { data: current } = await supabase
      .from("services")
      .select("specs")
      .eq("id", id)
      .maybeSingle();
    const specs = specsToRows(current?.specs);
    const next = [...specs];
    const idx = next.findIndex((s) => s.key.toLowerCase() === "icon");
    if (idx >= 0) next[idx] = { ...next[idx], value: patch.icon };
    else next.push({ id: "icon", key: "icon", value: patch.icon });
    updates.specs = rowsToSpecs(next);
  }

  return supabase.from("services").update(updates).eq("id", id);
}

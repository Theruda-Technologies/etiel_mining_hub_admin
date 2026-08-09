import { createAuthClient } from "@/features/auth/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CatalogProduct,
  CatalogService,
  CatalogStatus,
  SpecRow,
} from "../data/catalog";
import type { ProductCategory, ServiceCategory } from "../data/categories";

export type AdvertisementItem =
  | { kind: "product"; item: CatalogProduct }
  | { kind: "service"; item: CatalogService };

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

function mapProduct(row: Record<string, unknown>): CatalogProduct {
  return {
    id: String(row.id),
    title: String(row.name ?? ""),
    sku: String(row.sku ?? ""),
    category: String(row.category ?? ""),
    status: mapActive(row.is_active as boolean | null | undefined),
    images: Array.isArray(row.image_paths)
      ? row.image_paths.filter(Boolean).map(String)
      : [],
    description: String(row.description ?? ""),
    specs: specsToRows(row.specs),
    advertised: Boolean(row.is_advertisement),
  };
}

function mapService(row: Record<string, unknown>): CatalogService {
  return {
    id: String(row.id),
    title: String(row.name ?? ""),
    sku: String(row.sku ?? ""),
    category: String(row.category ?? ""),
    description: String(row.description ?? ""),
    status: mapActive(row.is_active as boolean | null | undefined),
    images: Array.isArray(row.image_paths)
      ? row.image_paths.filter(Boolean).map(String)
      : [],
    advertised: Boolean(row.is_advertisement),
  };
}

async function clearAllAdvertisements(except?: {
  kind: "product" | "service";
  id: string;
}) {
  const admin = createAdminClient();
  const stamp = { updated_at: new Date().toISOString() };

  const productQuery = admin
    .from("products")
    .update({ is_advertisement: false, ...stamp })
    .eq("is_advertisement", true);
  await (except?.kind === "product"
    ? productQuery.neq("id", except.id)
    : productQuery);

  const serviceQuery = admin
    .from("services")
    .update({ is_advertisement: false, ...stamp })
    .eq("is_advertisement", true);
  await (except?.kind === "service"
    ? serviceQuery.neq("id", except.id)
    : serviceQuery);
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapProduct(row as Record<string, unknown>));
}

export async function listServices(): Promise<CatalogService[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapService(row as Record<string, unknown>));
}

export async function getAdvertisement(): Promise<AdvertisementItem | null> {
  const supabase = await createAuthClient();
  const [{ data: product }, { data: service }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_advertisement", true)
      .maybeSingle(),
    supabase
      .from("services")
      .select("*")
      .eq("is_advertisement", true)
      .maybeSingle(),
  ]);

  if (product) {
    return {
      kind: "product",
      item: mapProduct(product as Record<string, unknown>),
    };
  }
  if (service) {
    return {
      kind: "service",
      item: mapService(service as Record<string, unknown>),
    };
  }
  return null;
}

export async function getProduct(id: string): Promise<CatalogProduct | null> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as Record<string, unknown>);
}

export async function getService(id: string): Promise<CatalogService | null> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapService(data as Record<string, unknown>);
}

export type CreateProductInput = {
  title: string;
  sku: string;
  category: ProductCategory;
  description?: string;
  status?: CatalogStatus;
  images?: string[];
  specs?: SpecRow[];
  advertised?: boolean;
};

export type CreateServiceInput = {
  title: string;
  sku: string;
  category: ServiceCategory;
  description?: string;
  status?: CatalogStatus;
  images?: string[];
  advertised?: boolean;
};

export async function createProduct(input: CreateProductInput) {
  const supabase = await createAuthClient();
  const title = input.title.trim();
  const sku = input.sku.trim();
  if (!title || !sku) {
    return { data: null, error: { message: "Title and SKU are required." } };
  }

  if (input.advertised) {
    await clearAllAdvertisements();
  }

  return supabase
    .from("products")
    .insert({
      name: title,
      slug: slugify(title) || `product-${Date.now()}`,
      sku,
      category: input.category,
      description: input.description?.trim() ?? "",
      price: 0,
      specs: rowsToSpecs(input.specs ?? []),
      image_paths: input.images ?? [],
      is_active: (input.status ?? "Draft") === "Active",
      is_advertisement: Boolean(input.advertised),
      sort_order: 0,
    })
    .select("*")
    .single();
}

export async function createService(input: CreateServiceInput) {
  const supabase = await createAuthClient();
  const title = input.title.trim();
  const sku = input.sku.trim();
  if (!title || !sku) {
    return { data: null, error: { message: "Title and SKU are required." } };
  }

  if (input.advertised) {
    await clearAllAdvertisements();
  }

  return supabase
    .from("services")
    .insert({
      name: title,
      slug: slugify(title) || `service-${Date.now()}`,
      sku,
      category: input.category,
      description: input.description?.trim() ?? "",
      price: 0,
      specs: [],
      image_paths: input.images ?? [],
      is_active: (input.status ?? "Active") === "Active",
      is_advertisement: Boolean(input.advertised),
      sort_order: 0,
    })
    .select("*")
    .single();
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
    updates.slug = slugify(patch.title) || `product-${Date.now()}`;
  }
  if (patch.sku !== undefined) updates.sku = patch.sku;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.status !== undefined) updates.is_active = patch.status === "Active";
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.specs !== undefined) updates.specs = rowsToSpecs(patch.specs);
  if (patch.images !== undefined) updates.image_paths = patch.images;
  if (patch.advertised !== undefined) {
    if (patch.advertised) {
      await clearAllAdvertisements({ kind: "product", id });
    }
    updates.is_advertisement = patch.advertised;
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
    updates.slug = slugify(patch.title) || `service-${Date.now()}`;
  }
  if (patch.sku !== undefined) updates.sku = patch.sku;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.status !== undefined) updates.is_active = patch.status === "Active";
  if (patch.images !== undefined) updates.image_paths = patch.images;
  if (patch.advertised !== undefined) {
    if (patch.advertised) {
      await clearAllAdvertisements({ kind: "service", id });
    }
    updates.is_advertisement = patch.advertised;
  }

  return supabase.from("services").update(updates).eq("id", id);
}

export async function deleteService(id: string) {
  const supabase = await createAuthClient();
  return supabase.from("services").delete().eq("id", id);
}

export async function clearAdvertisement() {
  await clearAllAdvertisements();
  return { ok: true as const };
}

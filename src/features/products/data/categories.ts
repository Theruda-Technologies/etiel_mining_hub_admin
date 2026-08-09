export type CatalogCategoryKind = "product" | "service";

export type CatalogCategory = {
  id: string;
  kind: CatalogCategoryKind;
  value: string;
  label: string;
  labelAm: string | null;
  sortOrder: number;
};

export type ProductCategory = string;
export type ServiceCategory = string;

/** Used when the catalog_categories table is not available yet. */
export function fallbackCategories(
  kind?: CatalogCategoryKind,
): CatalogCategory[] {
  const all: CatalogCategory[] = [
    {
      id: "fallback-p1",
      kind: "product",
      value: "metal_detectors",
      label: "Metal Detectors",
      labelAm: "የብረት መፈለጊያዎች",
      sortOrder: 1,
    },
    {
      id: "fallback-p2",
      kind: "product",
      value: "ground_scanners",
      label: "Ground Scanners",
      labelAm: "የመሬት ስካነሮች",
      sortOrder: 2,
    },
    {
      id: "fallback-p3",
      kind: "product",
      value: "drilling",
      label: "Drilling",
      labelAm: "ቁፋሮ",
      sortOrder: 3,
    },
    {
      id: "fallback-p4",
      kind: "product",
      value: "excavators",
      label: "Excavators",
      labelAm: "ቆፋሪዎች",
      sortOrder: 4,
    },
    {
      id: "fallback-p5",
      kind: "product",
      value: "mining_supplies",
      label: "Mining Supplies",
      labelAm: "የማዕድን አቅርቦቶች",
      sortOrder: 5,
    },
    {
      id: "fallback-s1",
      kind: "service",
      value: "training",
      label: "Training",
      labelAm: "ስልጠና",
      sortOrder: 1,
    },
    {
      id: "fallback-s2",
      kind: "service",
      value: "field_support",
      label: "Field Support",
      labelAm: "የመስክ ድጋፍ",
      sortOrder: 2,
    },
    {
      id: "fallback-s3",
      kind: "service",
      value: "on_site_assembly",
      label: "On-Site Assembly",
      labelAm: "በቦታው ላይ ስብሰባ",
      sortOrder: 3,
    },
    {
      id: "fallback-s4",
      kind: "service",
      value: "financing",
      label: "Financing",
      labelAm: "ፋይናንስ",
      sortOrder: 4,
    },
  ];
  return kind ? all.filter((c) => c.kind === kind) : all;
}

export function categoryLabel(
  categories: CatalogCategory[],
  value: string,
  locale: string = "en",
) {
  const match = categories.find((c) => c.value === value);
  if (!match) return value;
  if (locale.startsWith("am") && match.labelAm) return match.labelAm;
  return match.label;
}

/** @deprecated Prefer categories loaded from catalog_categories. */
export const PRODUCT_CATEGORIES = fallbackCategories("product").map((c) => ({
  value: c.value,
  label: c.label,
}));

/** @deprecated Prefer categories loaded from catalog_categories. */
export const SERVICE_CATEGORIES = fallbackCategories("service").map((c) => ({
  value: c.value,
  label: c.label,
}));

export function productCategoryLabel(value: string) {
  return categoryLabel(fallbackCategories("product"), value);
}

export function serviceCategoryLabel(value: string) {
  return categoryLabel(fallbackCategories("service"), value);
}

export function isProductCategory(value: string): value is ProductCategory {
  return fallbackCategories("product").some((c) => c.value === value);
}

export function isServiceCategory(value: string): value is ServiceCategory {
  return fallbackCategories("service").some((c) => c.value === value);
}

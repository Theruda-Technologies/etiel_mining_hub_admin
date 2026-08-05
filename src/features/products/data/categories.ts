export const PRODUCT_CATEGORIES = [
  { value: "metal_detectors", label: "Metal Detectors" },
  { value: "ground_scanners", label: "Ground Scanners" },
  { value: "drilling", label: "Drilling" },
  { value: "excavators", label: "Excavators" },
  { value: "mining_supplies", label: "Mining Supplies" },
] as const;

export const SERVICE_CATEGORIES = [
  { value: "training", label: "Training" },
  { value: "field_support", label: "Field Support" },
  { value: "on_site_assembly", label: "On-Site Assembly" },
  { value: "financing", label: "Financing" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["value"];

export function productCategoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function serviceCategoryLabel(value: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((c) => c.value === value);
}

export function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_CATEGORIES.some((c) => c.value === value);
}

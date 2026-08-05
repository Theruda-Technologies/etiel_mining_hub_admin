import type { ProductCategory, ServiceCategory } from "./categories";

export type CatalogStatus = "Active" | "Draft";

export type SpecRow = {
  id: string;
  key: string;
  value: string;
};

export type CatalogProduct = {
  id: string;
  title: string;
  sku: string;
  category: ProductCategory;
  status: CatalogStatus;
  images: string[];
  description: string;
  specs: SpecRow[];
};

export type CatalogService = {
  id: string;
  title: string;
  sku: string;
  category: ServiceCategory;
  description: string;
  status: CatalogStatus;
  images: string[];
  icon: "headset" | "gradcap";
};

export const sampleProducts: CatalogProduct[] = [];
export const sampleServices: CatalogService[] = [];

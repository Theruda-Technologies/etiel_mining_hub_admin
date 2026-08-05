"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterLinesIcon } from "@/shared/components/icons";
import { useSearchQuery } from "@/shared/components/search-context";
import { cn } from "@/shared/utils";
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  productCategoryLabel,
  serviceCategoryLabel,
} from "../data/categories";
import {
  sampleProducts,
  sampleServices,
  type CatalogProduct,
  type CatalogService,
  type CatalogStatus,
} from "../data/catalog";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";

type Tab = "products" | "services";

type CatalogManagerProps = {
  initialTab?: Tab;
  initialProducts?: CatalogProduct[];
  initialServices?: CatalogService[];
};

export function CatalogManager({
  initialTab = "products",
  initialProducts = sampleProducts,
  initialServices = sampleServices,
}: CatalogManagerProps) {
  const { t } = useTranslation();
  const { query } = useSearchQuery();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [products, setProducts] = useState(initialProducts);
  const [services, setServices] = useState(initialServices);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CatalogStatus>("all");
  const productTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const serviceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pendingProductPatches = useRef<
    Map<string, Partial<CatalogProduct>>
  >(new Map());
  const pendingServicePatches = useRef<
    Map<string, Partial<CatalogService>>
  >(new Map());

  useEffect(() => {
    return () => {
      productTimers.current.forEach(clearTimeout);
      serviceTimers.current.forEach(clearTimeout);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        product.title.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        productCategoryLabel(product.category).toLowerCase().includes(q)
      );
    });
  }, [products, query, categoryFilter, statusFilter]);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((service) => {
      if (categoryFilter !== "all" && service.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        service.title.toLowerCase().includes(q) ||
        service.sku.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        serviceCategoryLabel(service.category).toLowerCase().includes(q)
      );
    });
  }, [services, query, categoryFilter, statusFilter]);

  function updateProductLocal(id: string, patch: Partial<CatalogProduct>) {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const merged = {
      ...(pendingProductPatches.current.get(id) ?? {}),
      ...patch,
    };
    pendingProductPatches.current.set(id, merged);
    const existing = productTimers.current.get(id);
    if (existing) clearTimeout(existing);
    productTimers.current.set(
      id,
      setTimeout(() => {
        const body = pendingProductPatches.current.get(id);
        pendingProductPatches.current.delete(id);
        if (!body) return;
        void fetch("/api/catalog/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, patch: body }),
        });
      }, 450),
    );
  }

  function updateServiceLocal(id: string, patch: Partial<CatalogService>) {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const merged = {
      ...(pendingServicePatches.current.get(id) ?? {}),
      ...patch,
    };
    pendingServicePatches.current.set(id, merged);
    const existing = serviceTimers.current.get(id);
    if (existing) clearTimeout(existing);
    serviceTimers.current.set(
      id,
      setTimeout(() => {
        const body = pendingServicePatches.current.get(id);
        pendingServicePatches.current.delete(id);
        if (!body) return;
        void fetch("/api/catalog/services", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, patch: body }),
        });
      }, 450),
    );
  }

  async function deleteProductLocal(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await fetch("/api/catalog/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function deleteServiceLocal(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    await fetch("/api/catalog/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const categoryOptions =
    tab === "products" ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[15px] font-semibold text-accent">{t("products.adminHub")}</p>
          <h1 className="font-display mt-1 text-[28px] font-bold tracking-tight text-foreground">
            {t("products.title")}
          </h1>
          <p className="mt-1.5 max-w-xl text-[14px] text-muted">
            {t("products.subtitle")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/products/services/new"
            className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            {t("products.addService")}
          </Link>
          <Link
            href="/products/new"
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            {t("products.addProduct")}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
          <FilterLinesIcon className="size-3.5" />
          {t("products.filters")}
        </span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none"
        >
          <option value="all">{t("products.allCategories")}</option>
          {categoryOptions.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | CatalogStatus)
          }
          className="h-8 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none"
        >
          <option value="all">{t("products.allStatuses")}</option>
          <option value="Active">{t("common.active")}</option>
          <option value="Draft">{t("common.draft")}</option>
        </select>
        {query.trim() ? (
          <span className="text-[12px] text-muted">
            {t("products.searching", { query: query.trim() })}
          </span>
        ) : null}
      </div>

      <div className="flex gap-6 border-b border-border">
        {(
          [
            ["products", "products.productsTab"],
            ["services", "products.servicesTab"],
          ] as const
        ).map(([key, labelKey]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setCategoryFilter("all");
            }}
            className={cn(
              "relative pb-3 text-[14px] font-medium transition-colors",
              tab === key ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            {t(labelKey)}
            {tab === key ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        filteredProducts.length === 0 ? (
          <p className="text-[13px] text-muted">{t("products.noProducts")}</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onChange={(patch) => void updateProductLocal(product.id, patch)}
                onDelete={() => void deleteProductLocal(product.id)}
              />
            ))}
          </div>
        )
      ) : filteredServices.length === 0 ? (
        <p className="text-[13px] text-muted">{t("products.noServices")}</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onChange={(patch) => void updateServiceLocal(service.id, patch)}
              onDelete={() => void deleteServiceLocal(service.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

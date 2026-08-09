"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterLinesIcon, ImageOffIcon } from "@/shared/components/icons";
import { useSearchQuery } from "@/shared/components/search-context";
import { cn } from "@/shared/utils";
import {
  categoryLabel,
  type CatalogCategory,
} from "../data/categories";
import {
  sampleProducts,
  sampleServices,
  type CatalogProduct,
  type CatalogService,
  type CatalogStatus,
} from "../data/catalog";

type Tab = "products" | "services";

type CatalogManagerProps = {
  initialTab?: Tab;
  initialProducts?: CatalogProduct[];
  initialServices?: CatalogService[];
  productCategories?: CatalogCategory[];
  serviceCategories?: CatalogCategory[];
};

function statusClass(status: CatalogStatus) {
  return status === "Active"
    ? "border-success/50 bg-success-soft text-success"
    : "border-danger/50 bg-danger-soft text-danger";
}

export function CatalogManager({
  initialTab = "products",
  initialProducts = sampleProducts,
  initialServices = sampleServices,
  productCategories = [],
  serviceCategories = [],
}: CatalogManagerProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { query } = useSearchQuery();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [products, setProducts] = useState(initialProducts);
  const [services, setServices] = useState(initialServices);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CatalogStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearingAd, setClearingAd] = useState(false);

  const advertisement = useMemo(() => {
    const product = products.find((item) => item.advertised);
    if (product) return { kind: "product" as const, item: product };
    const service = services.find((item) => item.advertised);
    if (service) return { kind: "service" as const, item: service };
    return null;
  }, [products, services]);

  const categoryOptions =
    tab === "products" ? productCategories : serviceCategories;

  function labelFor(kind: Tab, value: string) {
    return categoryLabel(
      kind === "products" ? productCategories : serviceCategories,
      value,
      i18n.language,
    );
  }

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
        labelFor("products", product.category).toLowerCase().includes(q)
      );
    });
  }, [
    products,
    query,
    categoryFilter,
    statusFilter,
    productCategories,
    i18n.language,
  ]);

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
        labelFor("services", service.category).toLowerCase().includes(q)
      );
    });
  }, [
    services,
    query,
    categoryFilter,
    statusFilter,
    serviceCategories,
    i18n.language,
  ]);

  async function deleteProduct(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/catalog/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteService(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/catalog/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setServices((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function clearAdvertisement() {
    setClearingAd(true);
    try {
      const res = await fetch("/api/catalog/advertisement", {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) => ({ ...item, advertised: false })),
        );
        setServices((prev) =>
          prev.map((item) => ({ ...item, advertised: false })),
        );
        router.refresh();
      }
    } finally {
      setClearingAd(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[15px] font-semibold text-accent">
            {t("products.adminHub")}
          </p>
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

      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              {t("products.advertisement")}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("products.advertisementHint")}
            </p>
          </div>
        </div>
        {advertisement ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
              {advertisement.item.images[0] ? (
                <img
                  src={advertisement.item.images[0]}
                  alt={advertisement.item.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  <ImageOffIcon className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-foreground">
                {advertisement.item.title}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {advertisement.kind === "product"
                  ? t("products.advertisementTypeProduct")
                  : t("products.advertisementTypeService")}
                {" · "}
                {labelFor(
                  advertisement.kind === "product" ? "products" : "services",
                  advertisement.item.category,
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={
                  advertisement.kind === "product"
                    ? `/products/${advertisement.item.id}`
                    : `/products/services/${advertisement.item.id}`
                }
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px] font-medium text-foreground hover:border-accent/50 hover:text-accent"
              >
                {t("products.edit")}
              </Link>
              <button
                type="button"
                disabled={clearingAd}
                onClick={() => void clearAdvertisement()}
                className="inline-flex h-8 items-center rounded-md border border-danger/60 px-3 text-[12px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
              >
                {t("products.advertisementRemove")}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted">
            {t("products.advertisementEmpty")}
          </p>
        )}
      </section>

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
              {categoryLabel(categoryOptions, cat.value, i18n.language)}
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
          <CatalogListTable
            rows={filteredProducts.map((product) => ({
              id: product.id,
              href: `/products/${product.id}`,
              title: product.title,
              image: product.images[0],
              category: product.category,
              categoryLabel: labelFor("products", product.category),
              status: product.status,
            }))}
            busyId={busyId}
            onDelete={(id) => void deleteProduct(id)}
          />
        )
      ) : filteredServices.length === 0 ? (
        <p className="text-[13px] text-muted">{t("products.noServices")}</p>
      ) : (
        <CatalogListTable
          rows={filteredServices.map((service) => ({
            id: service.id,
            href: `/products/services/${service.id}`,
            title: service.title,
            image: service.images[0],
            category: service.category,
            categoryLabel: labelFor("services", service.category),
            status: service.status,
          }))}
          busyId={busyId}
          onDelete={(id) => void deleteService(id)}
        />
      )}
    </div>
  );
}

type CatalogListRow = {
  id: string;
  href: string;
  title: string;
  image?: string;
  category: string;
  categoryLabel: string;
  status: CatalogStatus;
};

function CatalogListTable({
  rows,
  busyId,
  onDelete,
}: {
  rows: CatalogListRow[];
  busyId: string | null;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {[
              t("products.image"),
              t("products.name"),
              t("products.category"),
              t("products.status"),
              t("settings.action"),
            ].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 font-mono text-[10px] font-medium tracking-[0.08em] text-muted uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(row.href)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(row.href);
                }
              }}
              className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <div className="size-14 overflow-hidden rounded-md border border-border bg-background">
                  {row.image ? (
                    <img
                      src={row.image}
                      alt={row.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted">
                      <ImageOffIcon className="size-5" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-[14px] font-medium text-foreground">
                {row.title}
              </td>
              <td className="px-4 py-3 text-[13px] text-muted-strong">
                {row.categoryLabel}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${statusClass(row.status)}`}
                >
                  {row.status === "Active"
                    ? t("common.active")
                    : t("common.draft")}
                </span>
              </td>
              <td
                className="px-4 py-3"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={row.href}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px] font-medium text-foreground hover:border-accent/50 hover:text-accent"
                  >
                    {t("products.edit")}
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => onDelete(row.id)}
                    className="inline-flex h-8 items-center rounded-md border border-danger/60 px-3 text-[12px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

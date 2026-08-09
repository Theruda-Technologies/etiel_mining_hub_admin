"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRightIcon } from "@/shared/components/icons";
import type { CatalogProduct, CatalogStatus } from "../data/catalog";
import type { CatalogCategory } from "../data/categories";
import { ProductCard } from "./product-card";

function statusSelectClass(status: CatalogStatus) {
  return status === "Active"
    ? "border-success/50 bg-success-soft text-success"
    : "border-danger/50 bg-danger-soft text-danger";
}

export function ProductDetailEditor({
  initialProduct,
  categories,
}: {
  initialProduct: CatalogProduct;
  categories: CatalogCategory[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function updateLocal(patch: Partial<CatalogProduct>) {
    setProduct((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/catalog/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          patch: {
            title: product.title,
            sku: product.sku,
            category: product.category,
            description: product.description,
            status: product.status,
            images: product.images,
            specs: product.specs,
            advertised: product.advertised,
          },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("products.catalogUnreachable"));
        return;
      }
      setDirty(false);
      setMessage(t("products.saved"));
      router.push("/products");
      router.refresh();
    } catch {
      setError(t("products.catalogUnreachable"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? t("products.catalogUnreachable"));
        setSaving(false);
        return;
      }
      router.push("/products");
      router.refresh();
    } catch {
      setError(t("products.catalogUnreachable"));
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <Link href="/products" className="hover:text-foreground">
            {t("products.productsTab")}
          </Link>
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground">{product.title}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
            {product.title}
          </h1>
          <select
            value={product.status}
            onChange={(e) =>
              updateLocal({
                status: e.target.value as CatalogProduct["status"],
              })
            }
            className={`h-9 rounded-md border px-3 text-[12px] font-semibold outline-none ${statusSelectClass(product.status)}`}
            aria-label={t("products.status")}
          >
            <option value="Active">{t("common.active")}</option>
            <option value="Draft">{t("common.draft")}</option>
          </select>
        </div>
        {message ? (
          <p className="mt-2 text-[12px] text-success">{message}</p>
        ) : null}
        {error ? <p className="mt-2 text-[12px] text-danger">{error}</p> : null}
      </div>

      <ProductCard
        product={product}
        categories={categories}
        onChange={updateLocal}
        onDelete={() => void handleDelete()}
        onSave={() => void handleSave()}
        saving={saving}
        dirty={dirty}
      />
    </div>
  );
}

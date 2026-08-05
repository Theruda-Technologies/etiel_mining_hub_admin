"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDownIcon,
  FilterLinesIcon,
} from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import {
  sampleProducts,
  sampleServices,
  type CatalogProduct,
  type CatalogService,
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
  const [tab, setTab] = useState<Tab>(initialTab);
  const [products, setProducts] = useState(initialProducts);
  const [services, setServices] = useState(initialServices);

  async function updateProductLocal(
    id: string,
    patch: Partial<CatalogProduct>,
  ) {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    await fetch("/api/catalog/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
  }

  async function updateServiceLocal(
    id: string,
    patch: Partial<CatalogService>,
  ) {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    await fetch("/api/catalog/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
  }

  async function deleteProductLocal(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await fetch("/api/catalog/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[15px] font-semibold text-accent">Admin Hub</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
            Product Management
          </h1>
          <p className="mt-1.5 max-w-xl text-[14px] text-muted">
            Manage catalog entries, update specifications, and control inventory
            visibility.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/products/services/new"
            className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            Add New Service
          </Link>
          <Link
            href="/products/new"
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            Add New Product
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
          <FilterLinesIcon className="size-3.5" />
          Filters:
        </span>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong"
        >
          All Categories
          <ChevronDownIcon className="size-3.5 text-muted" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong"
        >
          Status: Active
          <ChevronDownIcon className="size-3.5 text-muted" />
        </button>
      </div>

      <div className="flex gap-6 border-b border-border">
        {(
          [
            ["products", "Products"],
            ["services", "Services"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "relative pb-3 text-[14px] font-medium transition-colors",
              tab === key ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            {label}
            {tab === key ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onChange={(patch) => void updateProductLocal(product.id, patch)}
              onDelete={() => void deleteProductLocal(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onChange={(patch) => void updateServiceLocal(service.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

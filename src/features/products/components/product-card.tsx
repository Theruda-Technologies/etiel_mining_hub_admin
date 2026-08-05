"use client";

import {
  ImageOffIcon,
  TrashIcon,
} from "@/shared/components/icons";
import { ImageGalleryEditor } from "@/shared/components/image-gallery-editor";
import { PRODUCT_CATEGORIES } from "../data/categories";
import type { CatalogProduct } from "../data/catalog";

type ProductCardProps = {
  product: CatalogProduct;
  onChange: (patch: Partial<CatalogProduct>) => void;
  onDelete: () => void;
};

export function ProductCard({ product, onChange, onDelete }: ProductCardProps) {
  const isDraft = product.status === "Draft";
  const thumb = product.images[0];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-4">
        <div className="size-[110px] shrink-0 overflow-hidden rounded-md border border-border">
          {thumb ? (
            <img
              src={thumb}
              alt={product.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-background text-muted">
              <ImageOffIcon className="size-7" />
              <span className="text-[10px] tracking-wide uppercase">No Image</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <label className="block min-w-0 flex-1 text-[11px] text-muted">
              Product Title
              <input
                value={product.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-[15px] font-semibold text-foreground outline-none focus:border-accent/50"
              />
            </label>
            <StatusBadge status={product.status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] text-muted">
              SKU
              <input
                value={product.sku}
                onChange={(e) => onChange({ sku: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-[12px] text-muted-strong outline-none focus:border-accent/50"
              />
            </label>
            <label className="text-[11px] text-muted">
              Category
              <select
                value={product.category}
                onChange={(e) =>
                  onChange({
                    category: e.target.value as CatalogProduct["category"],
                  })
                }
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-accent/50"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <label className="mt-4 block text-[11px] text-muted">
        Short Description
        <textarea
          value={product.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <div className="mt-4">
        <p className="mb-2 text-[11px] tracking-[0.06em] text-muted uppercase">
          Images
        </p>
        <ImageGalleryEditor
          images={product.images}
          onChange={(images) => onChange({ images })}
          uploadKind="product"
        />
      </div>

      <div className="mt-4" data-specs>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] tracking-[0.06em] text-muted uppercase">
            Technical Specifications
          </p>
          <button
            type="button"
            onClick={() =>
              onChange({
                specs: [
                  ...product.specs,
                  { id: String(Date.now()), key: "", value: "" },
                ],
              })
            }
            className="text-[12px] font-medium text-accent hover:underline"
          >
            + Add Row
          </button>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          {product.specs.map((spec, index) => (
            <div
              key={spec.id}
              className={`grid grid-cols-[1fr_1fr_auto] gap-0 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <input
                value={spec.key}
                placeholder="Attribute"
                onChange={(e) => {
                  const specs = product.specs.map((row) =>
                    row.id === spec.id ? { ...row, key: e.target.value } : row,
                  );
                  onChange({ specs });
                }}
                className="border-r border-border bg-background px-3 py-2.5 font-mono text-[12px] text-foreground outline-none"
              />
              <input
                value={spec.value}
                placeholder="Value"
                onChange={(e) => {
                  const specs = product.specs.map((row) =>
                    row.id === spec.id ? { ...row, value: e.target.value } : row,
                  );
                  onChange({ specs });
                }}
                className="bg-background px-3 py-2.5 font-mono text-[12px] text-muted-strong outline-none"
              />
              <button
                type="button"
                aria-label="Remove spec row"
                onClick={() =>
                  onChange({
                    specs: product.specs.filter((row) => row.id !== spec.id),
                  })
                }
                className="px-3 text-muted hover:text-danger"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12px] text-muted">
          Status
          <select
            value={product.status}
            onChange={(e) =>
              onChange({ status: e.target.value as CatalogProduct["status"] })
            }
            className="h-9 rounded-md border border-border bg-background px-2 text-[12px] text-foreground"
          >
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 items-center rounded-md border border-danger/60 px-4 text-[12px] font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            Delete Product
          </button>
          <button
            type="button"
            className={
              isDraft
                ? "inline-flex h-9 items-center rounded-md bg-accent px-4 text-[12px] font-semibold text-black"
                : "inline-flex h-9 items-center rounded-md border border-border px-4 text-[12px] font-medium text-foreground"
            }
            onClick={() =>
              onChange({ status: isDraft ? "Active" : product.status })
            }
          >
            {isDraft ? "Publish" : "Saved"}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: CatalogProduct["status"] }) {
  const styles =
    status === "Active"
      ? "bg-success text-white"
      : "bg-danger text-white";

  return (
    <span
      className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold tracking-wide uppercase ${styles}`}
    >
      {status}
    </span>
  );
}

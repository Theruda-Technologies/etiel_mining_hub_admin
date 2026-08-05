"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronDownIcon } from "@/shared/components/icons";
import { ImageGalleryEditor } from "@/shared/components/image-gallery-editor";
import { PRODUCT_CATEGORIES } from "../data/categories";
import type { CatalogStatus, SpecRow } from "../data/catalog";
import type { ProductCategory } from "../data/categories";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50";

export function AddProductForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ProductCategory>("metal_detectors");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CatalogStatus>("Draft");
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<SpecRow[]>([
    { id: "1", key: "", value: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sku,
          category,
          description,
          status,
          images,
          specs: specs.filter((s) => s.key.trim() || s.value.trim()),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to create product.");
        return;
      }
      router.push("/products");
      router.refresh();
    } catch {
      setError("Unable to reach catalog service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.08em] text-muted uppercase">
            Inventory Management
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
            Add New Product
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save & Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
          <Field label="Product Title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="MAGNETAR Pulse X9"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU">
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="MD-X9-882"
              />
            </Field>
            <Field label="Category">
              <span className="relative block">
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ProductCategory)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
              </span>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Brief product overview..."
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] tracking-[0.08em] text-muted uppercase">
                Specifications
              </p>
              <button
                type="button"
                onClick={() =>
                  setSpecs((prev) => [
                    ...prev,
                    { id: String(Date.now()), key: "", value: "" },
                  ])
                }
                className="text-[12px] text-accent hover:underline"
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((row) => (
                <div key={row.id} className="flex gap-2">
                  <input
                    value={row.key}
                    onChange={(e) =>
                      setSpecs((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, key: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Attribute"
                    className={inputClass}
                  />
                  <input
                    value={row.value}
                    onChange={(e) =>
                      setSpecs((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, value: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Value"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
          <Field label="Publish Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CatalogStatus)}
              className={inputClass}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </Field>
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              Product Images
            </p>
            <ImageGalleryEditor
              images={images}
              onChange={setImages}
              uploadKind="product"
            />
          </div>
        </section>
      </div>

      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
      {label}
      <div className="mt-1.5 normal-case tracking-normal">{children}</div>
    </label>
  );
}

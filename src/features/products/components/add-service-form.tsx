"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, ChevronRightIcon } from "@/shared/components/icons";
import { ImageGalleryEditor } from "@/shared/components/image-gallery-editor";
import { SERVICE_CATEGORIES } from "../data/categories";
import type { CatalogStatus } from "../data/catalog";
import type { ServiceCategory } from "../data/categories";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50";

export function AddServiceForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("training");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CatalogStatus>("Active");
  const [images, setImages] = useState<string[]>([]);
  const [advertised, setAdvertised] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sku,
          category,
          description,
          status,
          images,
          advertised,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("products.createServiceFailed"));
        return;
      }
      router.push("/products?tab=services");
      router.refresh();
    } catch {
      setError(t("products.catalogUnreachable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted uppercase">
        <Link href="/products" className="hover:text-foreground">
          {t("products.productsTab")}
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <Link href="/products?tab=services" className="hover:text-foreground">
          {t("products.servicesTab")}
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-accent">{t("products.newService")}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-[28px] font-semibold tracking-tight">
          {t("products.addService")}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/products?tab=services"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px]"
          >
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black disabled:opacity-60"
          >
            {busy ? t("common.saving") : t("products.saveService")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {t("products.serviceImages")}
            </p>
            <ImageGalleryEditor
              images={images}
              onChange={setImages}
              uploadKind="service"
            />
          </div>

          <Field label={t("products.serviceTitle")}>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="24/7 Field Support"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("products.sku")}>
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="SVC-FIELD-24"
              />
            </Field>
            <Field label={t("products.category")}>
              <span className="relative block">
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ServiceCategory)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(`products.categories.${cat.value}`)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
              </span>
            </Field>
          </div>
          <Field label={t("products.description")}>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Describe the service offering..."
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
          <Field label={t("products.status")}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CatalogStatus)}
              className={`${inputClass} font-semibold ${
                status === "Active"
                  ? "border-success/50 bg-success-soft text-success"
                  : "border-danger/50 bg-danger-soft text-danger"
              }`}
            >
              <option value="Active">{t("common.active")}</option>
              <option value="Draft">{t("common.draft")}</option>
            </select>
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background px-3 py-3">
            <input
              type="checkbox"
              checked={advertised}
              onChange={(e) => setAdvertised(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-[13px] font-medium text-foreground normal-case tracking-normal">
                {t("products.advertisementPutOn")}
              </span>
              <span className="mt-0.5 block text-[12px] font-normal text-muted normal-case tracking-normal">
                {t("products.advertisementHint")}
              </span>
            </span>
          </label>
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

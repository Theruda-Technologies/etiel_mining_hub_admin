"use client";

import { useTranslation } from "react-i18next";
import { TrashIcon } from "@/shared/components/icons";
import { ImageGalleryEditor } from "@/shared/components/image-gallery-editor";
import { SERVICE_CATEGORIES } from "../data/categories";
import type { CatalogService } from "../data/catalog";

type ServiceCardProps = {
  service: CatalogService;
  onChange: (patch: Partial<CatalogService>) => void;
  onDelete: () => void;
  onSave: () => void;
  saving?: boolean;
  dirty?: boolean;
};

export function ServiceCard({
  service,
  onChange,
  onDelete,
  onSave,
  saving = false,
  dirty = false,
}: ServiceCardProps) {
  const { t } = useTranslation();

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4">
        <p className="mb-2 text-[11px] tracking-[0.06em] text-muted uppercase">
          {t("products.images")}
        </p>
        <ImageGalleryEditor
          images={service.images}
          onChange={(images) => onChange({ images })}
          uploadKind="service"
        />
      </div>

      <label className="mb-3 block min-w-0 text-[11px] text-muted">
        {t("products.serviceTitle")}
        <input
          value={service.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-[15px] font-semibold text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] text-muted">
          {t("products.sku")}
          <input
            value={service.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-[12px] outline-none focus:border-accent/50"
          />
        </label>
        <label className="text-[11px] text-muted">
          {t("products.category")}
          <select
            value={service.category}
            onChange={(e) =>
              onChange({
                category: e.target.value as CatalogService["category"],
              })
            }
            className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-[12px] outline-none focus:border-accent/50"
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {t(`products.categories.${cat.value}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-[11px] text-muted">
        {t("products.description")}
        <textarea
          value={service.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent/50"
        />
      </label>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background px-3 py-3">
        <input
          type="checkbox"
          checked={service.advertised}
          onChange={(e) => onChange({ advertised: e.target.checked })}
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span>
          <span className="block text-[13px] font-medium text-foreground">
            {t("products.advertisementPutOn")}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">
            {t("products.advertisementHint")}
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-danger/60 px-4 text-[12px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
        >
          <TrashIcon className="size-3.5" />
          {t("products.deleteService")}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[12px] font-semibold text-black disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </article>
  );
}

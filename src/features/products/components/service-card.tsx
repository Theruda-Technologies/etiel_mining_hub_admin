"use client";

import { GradCapIcon, HeadsetIcon, TrashIcon } from "@/shared/components/icons";
import { ImageGalleryEditor } from "@/shared/components/image-gallery-editor";
import { SERVICE_CATEGORIES } from "../data/categories";
import type { CatalogService } from "../data/catalog";

type ServiceCardProps = {
  service: CatalogService;
  onChange: (patch: Partial<CatalogService>) => void;
  onDelete: () => void;
};

export function ServiceCard({ service, onChange, onDelete }: ServiceCardProps) {
  const thumb = service.images[0];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-4">
        <div className="flex size-[110px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {thumb ? (
            <img
              src={thumb}
              alt={service.title}
              className="size-full object-cover"
            />
          ) : service.icon === "headset" ? (
            <HeadsetIcon className="size-12 text-accent" />
          ) : (
            <GradCapIcon className="size-12 text-accent" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-2">
            <label className="block min-w-0 flex-1 text-[11px] text-muted">
              Service Title
              <input
                value={service.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-[15px] font-semibold text-foreground outline-none focus:border-accent/50"
              />
            </label>
            <span className="shrink-0 rounded bg-success px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
              {service.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] text-muted">
              SKU
              <input
                value={service.sku}
                onChange={(e) => onChange({ sku: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-[12px] outline-none focus:border-accent/50"
              />
            </label>
            <label className="text-[11px] text-muted">
              Category
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
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <label className="mt-4 block text-[11px] text-muted">
        Description
        <textarea
          value={service.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent/50"
        />
      </label>

      <div className="mt-4">
        <p className="mb-2 text-[11px] tracking-[0.06em] text-muted uppercase">
          Images
        </p>
        <ImageGalleryEditor
          images={service.images}
          onChange={(images) => onChange({ images })}
          uploadKind="service"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Icon
            <select
              value={service.icon}
              onChange={(e) =>
                onChange({ icon: e.target.value as CatalogService["icon"] })
              }
              className="h-9 rounded-md border border-border bg-background px-2 text-[12px]"
            >
              <option value="headset">Headset</option>
              <option value="gradcap">Graduation Cap</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Status
            <select
              value={service.status}
              onChange={(e) =>
                onChange({ status: e.target.value as CatalogService["status"] })
              }
              className="h-9 rounded-md border border-border bg-background px-2 text-[12px]"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-danger/60 px-4 text-[12px] font-medium text-danger hover:bg-danger-soft"
        >
          <TrashIcon className="size-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

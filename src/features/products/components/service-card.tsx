"use client";

import { GradCapIcon, HeadsetIcon } from "@/shared/components/icons";
import type { CatalogService } from "../data/catalog";

type ServiceCardProps = {
  service: CatalogService;
  onChange: (patch: Partial<CatalogService>) => void;
};

export function ServiceCard({ service, onChange }: ServiceCardProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-4">
        <div className="flex size-[110px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
          {service.icon === "headset" ? (
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
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[12px] font-medium text-foreground transition-colors hover:border-muted"
        >
          Save Changes
        </button>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDownIcon,
  TrashIcon,
  UploadCloudIcon,
} from "@/shared/components/icons";

type SpecRow = { id: string; key: string; value: string };
type PublishStatus = "Draft" | "Active" | "Archived";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50";

export function AddProductForm() {
  const [specs, setSpecs] = useState<SpecRow[]>([
    { id: "1", key: "", value: "" },
    { id: "2", key: "", value: "" },
  ]);
  const [status, setStatus] = useState<PublishStatus>("Draft");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] tracking-[0.08em] text-muted uppercase">
            Admin Hub
          </p>
          <p className="mt-3 text-[11px] font-medium tracking-[0.1em] text-accent uppercase">
            Inventory Management
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
            Add New Product
          </h1>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link
            href="/products"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black"
          >
            Save & Publish
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 border-b border-border pb-3 text-[15px] font-medium">
              Basic Information
            </h2>
            <div className="space-y-4">
              <Field label="Product Title" required>
                <input
                  placeholder="e.g. Komatsu PC200-8 Excavator"
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="SKU / Asset ID" required>
                  <input
                    placeholder="EXC-200-8-A1"
                    className={`${inputClass} font-mono`}
                  />
                </Field>
                <Field label="Category" required>
                  <span className="relative block">
                    <select className={`${inputClass} appearance-none pr-9`}>
                      <option>Select equipment category</option>
                      <option>Drilling</option>
                      <option>Haulage</option>
                      <option>Conveyors</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                  </span>
                </Field>
              </div>
              <Field label="Short Description">
                <textarea
                  rows={4}
                  placeholder="Enter a brief overview of the equipment's capabilities..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-[15px] font-medium">Technical Specifications</h2>
              <button
                type="button"
                onClick={() =>
                  setSpecs((prev) => [
                    ...prev,
                    { id: String(Date.now()), key: "", value: "" },
                  ])
                }
                className="text-[12px] font-medium text-accent hover:underline"
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
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
                    placeholder={
                      index === 0 ? "e.g. Power Output" : "e.g. Operating Weight"
                    }
                    className={`${inputClass} flex-1`}
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
                    placeholder={
                      index === 0
                        ? "e.g. 110 kW (147 HP) @ 2,000 rpm"
                        : "e.g. 20,000 kg"
                    }
                    className={`${inputClass} flex-[1.4]`}
                  />
                  <button
                    type="button"
                    aria-label="Remove row"
                    onClick={() =>
                      setSpecs((prev) =>
                        prev.filter((item) => item.id !== row.id),
                      )
                    }
                    className="rounded p-2 text-muted hover:text-danger"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 border-b border-border pb-3 text-[15px] font-medium">
              Product Media
            </h2>
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-4 text-center">
              <UploadCloudIcon className="mb-3 size-8 text-accent" />
              <p className="text-[12px] font-medium tracking-wide text-muted-strong uppercase">
                Drag & Drop Image or click to browse
              </p>
              <p className="mt-1 text-[11px] text-muted">1920x1080px (Max 5MB)</p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 border-b border-border pb-3 text-[15px] font-medium">
              Publishing Status
            </h2>
            <div className="space-y-3">
              {(
                [
                  ["Draft", "DRAFT"],
                  ["Active", "ACTIVE (PUBLIC)"],
                  ["Archived", "ARCHIVED"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 text-[13px] text-foreground"
                >
                  <span
                    className={`flex size-4 items-center justify-center rounded-full border ${
                      status === value ? "border-accent" : "border-muted"
                    }`}
                  >
                    {status === value ? (
                      <span className="size-2 rounded-full bg-accent" />
                    ) : null}
                  </span>
                  <input
                    type="radio"
                    name="publish-status"
                    className="sr-only"
                    checked={status === value}
                    onChange={() => setStatus(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] tracking-[0.08em] text-muted uppercase">
      {label}
      {required ? <span className="text-accent"> *</span> : null}
      <div className="mt-1.5 normal-case tracking-normal">{children}</div>
    </label>
  );
}

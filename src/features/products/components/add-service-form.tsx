"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileUpIcon,
  InfoIcon,
} from "@/shared/components/icons";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50";

type Tier = {
  id: string;
  name: string;
  badge?: string;
  recommended?: boolean;
  features: { label: string; enabled: boolean }[];
};

export function AddServiceForm() {
  const [status, setStatus] = useState<"Active" | "Draft">("Active");
  const [tiers, setTiers] = useState<Tier[]>([
    {
      id: "standard",
      name: "Standard",
      badge: "Base",
      features: [
        { label: "24/7 Phone Support", enabled: true },
        { label: "Quarterly Diagnostics", enabled: true },
        { label: "On-Site Emergency Response", enabled: false },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      recommended: true,
      features: [
        { label: "24/7 Dedicated Account Rep", enabled: true },
        { label: "Monthly Diagnostics & Reporting", enabled: true },
        { label: "48hr On-Site Emergency Response", enabled: true },
      ],
    },
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] font-semibold text-accent">Admin Hub</p>

      <nav className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted uppercase">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <Link
          href="/products?tab=services"
          className="hover:text-foreground"
        >
          Services
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-accent">New Service Definition</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-[28px] font-semibold tracking-tight">
          Initialize New Service Protocol
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/products?tab=services"
            className="inline-flex h-9 items-center rounded-md border border-accent/70 px-4 text-[13px] font-medium text-accent"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black"
          >
            Deploy Service
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border border-l-accent bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <h2 className="text-[15px] font-medium">Core Specifications</h2>
              <InfoIcon className="size-4 text-accent" />
            </div>
            <div className="space-y-4">
              <Field label="Service Title">
                <input
                  placeholder="e.g. Preventative Maintenance Pro"
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Classification Category">
                  <span className="relative block">
                    <select
                      defaultValue="System Support"
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option>System Support</option>
                      <option>Field Operations</option>
                      <option>Training</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                  </span>
                </Field>
                <Field label="Coverage Zone">
                  <span className="relative block">
                    <select
                      defaultValue="Global Protocol"
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option>Global Protocol</option>
                      <option>Regional APAC</option>
                      <option>Site Only</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                  </span>
                </Field>
              </div>
              <Field label="Detailed Service Description">
                <textarea
                  rows={5}
                  placeholder="Enter comprehensive technical breakdown of service deliverables..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-[15px] font-medium">Service Tiers</h2>
              <button
                type="button"
                onClick={() =>
                  setTiers((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      name: "Custom",
                      features: [
                        { label: "Custom Feature", enabled: false },
                      ],
                    },
                  ])
                }
                className="text-[12px] font-medium text-accent hover:underline"
              >
                + Add Tier
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-md border p-4 ${
                    tier.recommended
                      ? "border-accent bg-accent-soft/40"
                      : "border-border bg-background"
                  }`}
                >
                  {tier.recommended ? (
                    <span className="absolute top-3 right-3 rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-black uppercase">
                      Recommended
                    </span>
                  ) : null}
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-[14px] font-medium">{tier.name}</p>
                    {tier.badge ? (
                      <span className="rounded bg-pending-bg px-1.5 py-0.5 text-[10px] text-pending-fg uppercase">
                        {tier.badge}
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-1 space-y-2">
                    {tier.features.map((feature) => (
                      <li
                        key={feature.label}
                        className="flex items-center gap-2 text-[12px] text-muted-strong"
                      >
                        <span
                          className={`flex size-4 items-center justify-center rounded-full border text-[10px] ${
                            feature.enabled
                              ? "border-accent text-accent"
                              : "border-muted text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 border-b border-border pb-3 text-[15px] font-medium">
              Operational Parameters
            </h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] tracking-[0.08em] text-muted uppercase">
                  Deployment Status
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ["Active", "Active (Live)"],
                      ["Draft", "Draft"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 text-[13px]"
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
                        className="sr-only"
                        checked={status === value}
                        onChange={() => setStatus(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="SLA Response Time (Target)">
                <span className="relative block">
                  <input
                    placeholder="e.g. 24"
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] tracking-wide text-muted uppercase">
                    Hrs
                  </span>
                </span>
              </Field>
              <Field label="Internal Department Lead">
                <input
                  placeholder="e.g. Maintenance Div A"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-2 text-[15px] font-medium">
              Associated Documentation
            </h2>
            <p className="mb-4 text-[12px] text-muted">
              Attach standard operating procedures (SOPs) or service brochures.
            </p>
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-4 text-center">
              <FileUpIcon className="mb-3 size-8 text-accent" />
              <p className="font-mono text-[12px] tracking-wide text-accent uppercase">
                Drag & Drop Protocol Files
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                PDF, DOCX up to 50MB
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
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
    <label className="block text-[11px] tracking-[0.08em] text-muted uppercase">
      {label}
      <div className="mt-1.5 normal-case tracking-normal">{children}</div>
    </label>
  );
}

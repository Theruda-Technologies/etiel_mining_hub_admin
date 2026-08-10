"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { ChevronRightIcon } from "@/shared/components/icons";
import type { CatalogService, CatalogStatus } from "../data/catalog";
import type { CatalogCategory } from "../data/categories";
import { ServiceCard } from "./service-card";

function statusSelectClass(status: CatalogStatus) {
  return status === "Active"
    ? "border-success/50 bg-success-soft text-success"
    : "border-danger/50 bg-danger-soft text-danger";
}

export function ServiceDetailEditor({
  initialService,
  categories,
}: {
  initialService: CatalogService;
  categories: CatalogCategory[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [service, setService] = useState(initialService);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function updateLocal(patch: Partial<CatalogService>) {
    setService((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/catalog/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: service.id,
          patch: {
            title: service.title,
            sku: service.sku,
            category: service.category,
            description: service.description,
            status: service.status,
            images: service.images,
            advertised: service.advertised,
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
      router.push("/products?tab=services");
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
      const res = await fetch("/api/catalog/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? t("products.catalogUnreachable"));
        setSaving(false);
        setConfirmOpen(false);
        return;
      }
      router.push("/products?tab=services");
      router.refresh();
    } catch {
      setError(t("products.catalogUnreachable"));
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <Link href="/products?tab=services" className="hover:text-foreground">
            {t("products.servicesTab")}
          </Link>
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground">{service.title}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
            {service.title}
          </h1>
          <select
            value={service.status}
            onChange={(e) =>
              updateLocal({
                status: e.target.value as CatalogService["status"],
              })
            }
            className={`h-9 rounded-md border px-3 text-[12px] font-semibold outline-none ${statusSelectClass(service.status)}`}
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

      <ServiceCard
        service={service}
        categories={categories}
        onChange={updateLocal}
        onDelete={() => setConfirmOpen(true)}
        onSave={() => void handleSave()}
        saving={saving}
        dirty={dirty}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={t("products.confirmDeleteTitle")}
        message={t("products.confirmDeleteService")}
        busy={saving}
        onCancel={() => {
          if (saving) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

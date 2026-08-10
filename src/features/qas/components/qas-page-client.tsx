"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchQuery } from "@/shared/components/search-context";
import {
  INQUIRY_STATUSES,
  type ContactInquiry,
  type InquiryStatus,
} from "../data/inquiries";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale.startsWith("am") ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: InquiryStatus) {
  switch (status) {
    case "new":
      return "border-accent/50 bg-accent-soft text-accent";
    case "in_progress":
      return "border-accent/40 bg-background text-accent";
    case "resolved":
      return "border-success/50 bg-success-soft text-success";
    case "closed":
      return "border-border bg-background text-muted-strong";
    default:
      return "border-border bg-background text-muted";
  }
}

export function QasPageClient({
  inquiries: initial,
}: {
  inquiries: ContactInquiry[];
}) {
  const { t, i18n } = useTranslation();
  const { query } = useSearchQuery();
  const [items, setItems] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState(initial[0]?.internalNotes ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        (item.email?.toLowerCase().includes(q) ?? false) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  const selected =
    filtered.find((item) => item.id === selectedId) ??
    filtered[0] ??
    null;

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setNotesDraft(selected.internalNotes);
  }, [selected?.id]);

  function statusLabel(status: InquiryStatus | "all") {
    if (status === "all") return t("common.allStatuses");
    return t(`qas.status.${status}`);
  }

  function selectInquiry(item: ContactInquiry) {
    setSelectedId(item.id);
    setNotesDraft(item.internalNotes);
    setError(null);
  }

  async function saveInquiry(patch: {
    status?: InquiryStatus;
    internalNotes?: string;
  }) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/qas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          ...patch,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("qas.updateFailed"));
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                status: patch.status ?? item.status,
                internalNotes:
                  patch.internalNotes !== undefined
                    ? patch.internalNotes
                    : item.internalNotes,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch {
      setError(t("qas.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[24px] font-bold tracking-tight sm:text-[28px]">
          {t("qas.title")}
        </h2>
        <p className="mt-1 text-[14px] text-muted">{t("qas.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | InquiryStatus)
          }
          className="h-8 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none"
        >
          <option value="all">{statusLabel("all")}</option>
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-muted">
          {t("qas.count", { count: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-muted">{t("qas.empty")}</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-3 xl:hidden">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectInquiry(item)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected?.id === item.id
                    ? "border-accent/50 bg-accent-soft/40"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {item.fullName}
                  </p>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] text-muted-strong">
                  {item.message}
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  {formatDate(item.createdAt, i18n.language)}
                </p>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-border bg-surface xl:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {[
                    t("qas.name"),
                    t("qas.contact"),
                    t("qas.statusLabel"),
                    t("qas.date"),
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 font-mono text-[10px] font-medium tracking-[0.08em] text-muted uppercase"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectInquiry(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectInquiry(item);
                      }
                    }}
                    className={`cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                      selected?.id === item.id
                        ? "bg-accent-soft/30"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-medium text-foreground">
                        {item.fullName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
                        {item.message}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-strong">
                      <p>{item.phone}</p>
                      {item.email ? (
                        <p className="mt-0.5 text-[12px] text-muted">
                          {item.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">
                      {formatDate(item.createdAt, i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground">
                    {selected.fullName}
                  </h3>
                  <p className="mt-1 text-[12px] text-muted">
                    {formatDate(selected.createdAt, i18n.language)}
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${statusClass(selected.status)}`}
                >
                  {statusLabel(selected.status)}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                    {t("qas.phone")}
                  </dt>
                  <dd className="mt-1 text-[13px] text-foreground">
                    <a href={`tel:${selected.phone}`} className="hover:text-accent">
                      {selected.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                    {t("qas.email")}
                  </dt>
                  <dd className="mt-1 text-[13px] text-foreground">
                    {selected.email ? (
                      <a
                        href={`mailto:${selected.email}`}
                        className="hover:text-accent"
                      >
                        {selected.email}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                  {t("qas.message")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {selected.message}
                </p>
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                    {t("qas.statusLabel")}
                  </span>
                  <select
                    value={selected.status}
                    disabled={busy}
                    onChange={(e) =>
                      void saveInquiry({
                        status: e.target.value as InquiryStatus,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none disabled:opacity-60"
                  >
                    {INQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                    {t("qas.internalNotes")}
                  </span>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted"
                    placeholder={t("qas.notesPlaceholder")}
                  />
                </label>

                {error ? (
                  <p className="text-[12px] text-danger">{error}</p>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void saveInquiry({ internalNotes: notesDraft })
                  }
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-black disabled:opacity-60"
                >
                  {busy ? t("common.saving") : t("qas.saveNotes")}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

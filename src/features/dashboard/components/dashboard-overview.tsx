"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardStats } from "../types";
import type { DashboardOrderRow } from "../api/stats";
import {
  CartCheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FilterIcon,
  HeadsetIcon,
  PackageIcon,
  SortIcon,
} from "@/shared/components/icons";
import { useSearchQuery } from "@/shared/components/search-context";

type DashboardOverviewProps = {
  stats: DashboardStats;
  orders?: DashboardOrderRow[];
};

const statusStyles = {
  CONFIRMED: "bg-success-soft text-success",
  PENDING: "bg-pending-bg text-pending-fg",
  CANCELLED: "bg-danger-soft text-danger",
  PROCESSING: "bg-accent-soft text-accent",
  SHIPPED: "bg-success-soft text-success",
} as const;

type StatusFilter = "all" | DashboardOrderRow["status"];

function exportOrdersCsv(rows: DashboardOrderRow[], filename: string) {
  const header = ["Order ID", "Client", "Equipment", "Date", "Status"];
  const lines = [
    header.join(","),
    ...rows.map((order) =>
      [order.id, order.client, order.equipment, order.date, order.status]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DashboardOverview({
  stats,
  orders = [],
}: DashboardOverviewProps) {
  const { t } = useTranslation();
  const { query } = useSearchQuery();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortNewest, setSortNewest] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.client.toLowerCase().includes(q) ||
        order.equipment.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.date.toLowerCase().includes(q)
      );
    });
    return sortNewest ? rows : [...rows].reverse();
  }, [orders, query, statusFilter, sortNewest]);

  const columns = [
    t("dashboard.orderId"),
    t("dashboard.client"),
    t("dashboard.equipment"),
    t("dashboard.date"),
    t("dashboard.status"),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-medium text-muted">
          {t("common.adminHub")}
        </p>
        <h2 className="font-display mt-1 text-[28px] font-bold tracking-tight text-foreground">
          {t("dashboard.title")}
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">{t("dashboard.subtitle")}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill
            count={stats.pendingCount}
            label={t("dashboard.pending")}
            tone="warning"
          />
          <StatusPill
            count={stats.processingCount}
            label={t("dashboard.processing")}
            tone="success"
          />
          <StatusPill
            count={stats.failedCount}
            label={t("dashboard.cancelled")}
            tone="danger"
          />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={t("dashboard.products")}
          value={String(stats.productCount)}
          footer={
            <Link href="/products" className="text-accent hover:underline">
              {t("dashboard.manageCatalog")}
            </Link>
          }
          icon={<PackageIcon className="size-5 text-accent" />}
        />
        <MetricCard
          label={t("dashboard.services")}
          value={String(stats.serviceCount)}
          footer={
            <Link
              href="/products?tab=services"
              className="text-accent hover:underline"
            >
              {t("dashboard.viewServices")}
            </Link>
          }
          icon={<HeadsetIcon className="size-5 text-accent" />}
        />
        <MetricCard
          label={t("dashboard.orders")}
          value={String(stats.orderCount)}
          footer={
            <Link href="/orders" className="text-accent hover:underline">
              {t("dashboard.pendingCount", { count: stats.pendingOrders })}
            </Link>
          }
          icon={<CartCheckIcon className="size-5 text-accent" />}
        />
      </section>

      <section className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">{t("dashboard.filterByStatus")}</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="h-8 appearance-none rounded-md border border-border bg-surface py-0 pr-8 pl-3 text-[12px] text-muted-strong outline-none"
              >
                <option value="all">{t("common.allStatuses")}</option>
                <option value="PENDING">{t("common.pending")}</option>
                <option value="CONFIRMED">{t("common.confirmed")}</option>
                <option value="PROCESSING">{t("common.processing")}</option>
                <option value="SHIPPED">{t("common.shipped")}</option>
                <option value="CANCELLED">{t("common.cancelled")}</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted" />
            </label>
            <button
              type="button"
              onClick={() => setSortNewest((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong transition-colors hover:border-muted"
            >
              <FilterIcon className="size-3.5 text-muted" />
              {sortNewest
                ? t("dashboard.newestFirst")
                : t("dashboard.oldestFirst")}
            </button>
            {query.trim() ? (
              <span className="text-[12px] text-muted">
                {t("dashboard.searching", { query: query.trim() })}
              </span>
            ) : null}
          </div>

          <h3 className="font-display text-[15px] font-medium text-foreground">
            {t("dashboard.recentOrders")}
          </h3>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                exportOrdersCsv(filtered, "etiel-orders-export.csv")
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong transition-colors hover:border-muted"
            >
              <DownloadIcon className="size-3.5 text-muted" />
              {t("common.exportCsv")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {columns.map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    <span className="inline-flex items-center gap-1">
                      {heading}
                      {heading === t("dashboard.date") ||
                      heading === t("dashboard.status") ? (
                        <SortIcon className="size-3.5 text-muted/70" />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[13px] text-muted"
                  >
                    {orders.length === 0
                      ? t("dashboard.noOrders")
                      : t("dashboard.noMatches")}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4 font-mono text-[13px] font-semibold text-foreground">
                      <Link
                        href={`/orders/${order.id.replace(/^#/, "")}`}
                        className="hover:text-accent hover:underline"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-foreground">
                      {order.client}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-foreground">
                      {order.equipment}
                    </td>
                    <td className="px-4 py-4 font-mono text-[13px] text-foreground">
                      {order.date}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusPill({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "warning" | "success" | "danger";
}) {
  const tones = {
    warning: {
      wrap: "border-accent/50 text-accent",
      dot: "bg-accent",
    },
    success: {
      wrap: "border-success/50 text-success",
      dot: "bg-success",
    },
    danger: {
      wrap: "border-danger/50 text-danger",
      dot: "bg-danger",
    },
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${tones.wrap}`}
    >
      <span className={`size-1.5 rounded-full ${tones.dot}`} />
      {count} {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  footer,
  icon,
}: {
  label: string;
  value: string;
  footer: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
          {label}
        </p>
        {icon}
      </div>
      <p className="font-display mt-4 text-[36px] leading-none font-bold tracking-tight text-foreground">
        {value}
      </p>
      <div className="mt-4 text-[12px]">{footer}</div>
    </article>
  );
}

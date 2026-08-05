"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardStats } from "../types";
import type { DashboardOrderRow } from "../api/stats";
import {
  ChevronDownIcon,
  DownloadIcon,
  FilterIcon,
  HourglassIcon,
  MoreIcon,
  SortIcon,
  TrendUpIcon,
  WarningIcon,
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

export function DashboardOverview({
  stats,
  orders = [],
}: DashboardOverviewProps) {
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-medium text-muted">Admin Hub</p>
        <h2 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
          System Dashboard
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">
          Real-time overview of mining operations and logistics.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill
            count={stats.pendingCount}
            label="PENDING"
            tone="warning"
          />
          <StatusPill
            count={stats.processingCount}
            label="PROCESSING"
            tone="success"
          />
          <StatusPill
            count={stats.failedCount}
            label="CANCELLED"
            tone="danger"
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="New Orders"
          value={String(stats.newOrders)}
          footer={
            <span className="flex items-center gap-1 text-success">
              <span aria-hidden>↑</span> +12% vs last week
            </span>
          }
          icon={<TrendUpIcon className="size-5 text-accent" />}
        />
        <MetricCard
          label="Pending Orders"
          value={String(stats.pendingOrders)}
          footer={
            <span className="flex items-center gap-1.5 text-danger">
              <WarningIcon className="size-3.5" />
              Requires attention
            </span>
          }
          icon={<HourglassIcon className="size-5 text-muted" />}
        />
      </section>

      <section className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="h-8 appearance-none rounded-md border border-border bg-surface py-0 pr-8 pl-3 text-[12px] text-muted-strong outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted" />
            </label>
            <button
              type="button"
              onClick={() => setSortNewest((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong transition-colors hover:border-muted"
            >
              <FilterIcon className="size-3.5 text-muted" />
              {sortNewest ? "Newest first" : "Oldest first"}
            </button>
            {query.trim() ? (
              <span className="text-[12px] text-muted">
                Searching “{query.trim()}”
              </span>
            ) : null}
          </div>

          <h3 className="text-[15px] font-medium text-foreground">
            Recent Orders
          </h3>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong transition-colors hover:border-muted"
            >
              <DownloadIcon className="size-3.5 text-muted" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Order ID",
                  "Client",
                  "Equipment",
                  "Date",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    <span className="inline-flex items-center gap-1">
                      {heading}
                      {heading === "Date" || heading === "Status" ? (
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-[13px] text-muted"
                  >
                    {orders.length === 0
                      ? "No orders yet. Run `npm run seed` to load demo data."
                      : "No orders match your search or filters."}
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
                    <td className="px-4 py-4 text-[13px] text-foreground">
                      {order.date}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="rounded p-1 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                        aria-label={`Actions for ${order.id}`}
                      >
                        <MoreIcon className="size-4" />
                      </button>
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
      <p className="mt-4 text-[36px] leading-none font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <div className="mt-4 text-[12px]">{footer}</div>
    </article>
  );
}

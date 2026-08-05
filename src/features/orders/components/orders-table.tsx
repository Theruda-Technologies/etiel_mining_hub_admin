"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import type { OrderStatus } from "@/features/orders/data/orders";
import { useSearchQuery } from "@/shared/components/search-context";

type OrderRow = {
  id: string;
  status: OrderStatus;
  buyer: { fullName: string; company: string };
};

const ALL_STATUSES: Array<"all" | OrderStatus> = [
  "all",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Cancelled",
];

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const { t } = useTranslation();
  const { query } = useSearchQuery();
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.buyer.fullName.toLowerCase().includes(q) ||
        order.buyer.company.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const statusLabel = (status: "all" | OrderStatus) => {
    if (status === "all") return t("common.allStatuses");
    const map: Record<OrderStatus, string> = {
      Pending: t("common.pending"),
      Confirmed: t("common.confirmed"),
      Processing: t("common.processing"),
      Shipped: t("common.shipped"),
      Cancelled: t("common.cancelled"),
    };
    return map[status];
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | OrderStatus)
          }
          className="h-8 rounded-md border border-border bg-surface px-3 text-[12px] text-muted-strong outline-none"
        >
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        {query.trim() ? (
          <span className="text-[12px] text-muted">
            {t("orders.searching", { query: query.trim() })}
          </span>
        ) : null}
      </div>

      <section className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  t("orders.orderId"),
                  t("orders.buyer"),
                  t("orders.company"),
                  t("orders.status"),
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[13px] text-muted"
                  >
                    {t("orders.noMatches")}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-[13px] font-semibold text-accent hover:underline"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {order.buyer.fullName}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {order.buyer.company}
                    </td>
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.status} />
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

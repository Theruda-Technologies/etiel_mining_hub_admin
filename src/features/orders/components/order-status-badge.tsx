"use client";

import type { OrderStatus } from "@/features/orders/data/orders";
import { useTranslation } from "react-i18next";

export const orderStatusClassName: Record<OrderStatus, string> = {
  Pending: "bg-pending-bg text-pending-fg",
  Confirmed: "bg-success-soft text-success",
  Processing: "bg-accent-soft text-accent",
  Shipped: "bg-success-soft text-success",
  Cancelled: "bg-danger-soft text-danger",
};

const statusKey: Record<OrderStatus, string> = {
  Pending: "common.pending",
  Confirmed: "common.confirmed",
  Processing: "common.processing",
  Shipped: "common.shipped",
  Cancelled: "common.cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${orderStatusClassName[status]}`}
    >
      {t(statusKey[status])}
    </span>
  );
}

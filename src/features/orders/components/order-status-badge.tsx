import type { OrderStatus } from "@/features/orders/data/orders";

export const orderStatusClassName: Record<OrderStatus, string> = {
  Pending: "bg-pending-bg text-pending-fg",
  Confirmed: "bg-success-soft text-success",
  Processing: "bg-accent-soft text-accent",
  Shipped: "bg-success-soft text-success",
  Cancelled: "bg-danger-soft text-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${orderStatusClassName[status]}`}
    >
      {status}
    </span>
  );
}

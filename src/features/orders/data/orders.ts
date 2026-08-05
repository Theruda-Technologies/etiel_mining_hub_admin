export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Cancelled";

export type OrderItem = {
  id: string;
  name: string;
  description: string;
  sku: string;
  qty: number;
  image: string;
};

export type OrderTimelineEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  active?: boolean;
};

export type OrderDetail = {
  id: string;
  uuid: string;
  status: OrderStatus;
  allowedNextStatuses: OrderStatus[];
  items: OrderItem[];
  buyer: {
    fullName: string;
    company: string;
    email: string;
    phone: string;
    shippingAddress: string[];
  };
  notes: string;
  internalNotes: string;
  timeline: OrderTimelineEvent[];
};

/** DB status values and allowed forward transitions from update_order_status(). */
export const DB_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: [],
  cancelled: [],
};

export const DB_TO_UI: Record<string, OrderStatus> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export const UI_TO_DB: Record<OrderStatus, string> = {
  Pending: "pending",
  Confirmed: "confirmed",
  Processing: "processing",
  Shipped: "shipped",
  Cancelled: "cancelled",
};

export function mapDbStatus(status: string): OrderStatus {
  return DB_TO_UI[status.toLowerCase()] ?? "Pending";
}

export function allowedNextStatuses(dbStatus: string): OrderStatus[] {
  const next = DB_STATUS_TRANSITIONS[dbStatus.toLowerCase()] ?? [];
  return next.map((s) => mapDbStatus(s));
}

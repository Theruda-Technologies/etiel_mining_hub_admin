import { createAuthClient } from "@/features/auth/lib/server";
import type { OrderDetail, OrderStatus } from "../data/orders";

const UI_TO_DB: Record<OrderStatus, string> = {
  Pending: "pending",
  Processing: "processing",
  Processed: "confirmed",
  Failed: "cancelled",
};

function mapStatus(status: string): OrderStatus {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "processing") return "Processing";
  if (normalized === "confirmed" || normalized === "processed") return "Processed";
  if (normalized === "cancelled" || normalized === "failed") return "Failed";
  return "Pending";
}

function buildTimeline(
  status: OrderStatus,
  createdAt: string,
  updatedAt: string,
): OrderDetail["timeline"] {
  const placed = new Date(createdAt);
  const updated = new Date(updatedAt);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const events = [
    {
      id: "placed",
      title: "Order Placed",
      date: fmt(placed),
      description: "Order submitted via customer portal.",
      active: status === "Pending",
    },
    {
      id: "processing",
      title: "Processing",
      date: fmt(updated),
      description: "Operations team reviewing fulfillment requirements.",
      active: status === "Processing",
    },
    {
      id: "confirmed",
      title: "Order Confirmed",
      date: fmt(updated),
      description: "Order verified and released to logistics.",
      active: status === "Processed",
    },
    {
      id: "cancelled",
      title: "Order Cancelled",
      date: fmt(updated),
      description: "Order cancelled or marked failed.",
      active: status === "Failed",
    },
  ];

  if (status === "Failed") return events.filter((e) => e.id !== "confirmed");
  return events.filter((e) => e.id !== "cancelled");
}

export async function listOrders() {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, shipping_address, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((order) => {
    const company =
      String(order.shipping_address ?? "")
        .split(/[,—-]/)
        .map((s: string) => s.trim())
        .find(Boolean) ?? "—";

    return {
      id: order.order_number,
      uuid: order.id,
      status: mapStatus(order.status),
      buyer: {
        fullName: order.customer_name,
        company,
      },
    };
  });
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const normalized = id.replace(/^#/, "").toUpperCase();
  const supabase = await createAuthClient();

  let { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", normalized)
    .maybeSingle();

  if (!order) {
    const byUuid = await supabase
      .from("orders")
      .select("*")
      .eq("id", id.replace(/^#/, ""))
      .maybeSingle();
    order = byUuid.data;
  }

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const mappedItems = (items ?? []).map((item) => ({
    id: item.id,
    name: item.name_snapshot,
    description:
      item.item_type === "service" ? "Service line item" : "Product line item",
    sku: item.sku_snapshot,
    qty: item.quantity,
    image: "",
  }));

  const status = mapStatus(order.status);
  const address = String(order.shipping_address ?? "")
    .split(/\n|,/)
    .map((line: string) => line.trim())
    .filter(Boolean);

  return {
    id: order.order_number,
    status,
    items: mappedItems,
    buyer: {
      fullName: order.customer_name,
      company: address[0] ?? "—",
      email: order.customer_email,
      phone: order.customer_phone,
      shippingAddress: address.length ? address : [order.shipping_address],
    },
    notes: order.notes ?? "",
    timeline: buildTimeline(status, order.created_at, order.updated_at),
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  notes: string,
) {
  const supabase = await createAuthClient();
  const normalized = id.replace(/^#/, "").toUpperCase();
  const dbStatus = UI_TO_DB[status] ?? "pending";

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .or(`order_number.eq.${normalized},id.eq.${id.replace(/^#/, "")}`)
    .maybeSingle();

  if (!existing) {
    return { error: { message: "Order not found." } };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: dbStatus,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  return { error };
}

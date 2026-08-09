import { createAuthClient } from "@/features/auth/lib/server";
import type { DashboardStats } from "../types";

export type DashboardOrderRow = {
  id: string;
  client: string;
  equipment: string;
  date: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "PROCESSING" | "SHIPPED";
};

function mapDashStatus(
  status: string,
): DashboardOrderRow["status"] {
  const s = status.toLowerCase();
  if (s === "processing") return "PROCESSING";
  if (s === "confirmed") return "CONFIRMED";
  if (s === "shipped") return "SHIPPED";
  if (s === "cancelled" || s === "failed") return "CANCELLED";
  return "PENDING";
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createAuthClient();
  const [ordersRes, productsRes, servicesRes] = await Promise.all([
    supabase.from("orders").select("id, status", { count: "exact" }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const list = ordersRes.data ?? [];
  const pending = list.filter((o) => o.status === "pending").length;
  const processing = list.filter((o) => o.status === "processing").length;
  const failed = list.filter(
    (o) => o.status === "cancelled" || o.status === "failed",
  ).length;

  return {
    pendingCount: pending,
    processingCount: processing,
    failedCount: failed,
    productCount: productsRes.count ?? 0,
    serviceCount: servicesRes.count ?? 0,
    orderCount: ordersRes.count ?? list.length,
    pendingOrders: pending,
  };
}

export async function getRecentOrders(
  limit = 8,
): Promise<DashboardOrderRow[]> {
  const supabase = await createAuthClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!orders?.length) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, name_snapshot")
    .in(
      "order_id",
      orders.map((o) => o.id),
    );

  const firstItem = new Map<string, string>();
  for (const item of items ?? []) {
    if (!firstItem.has(item.order_id)) {
      firstItem.set(item.order_id, item.name_snapshot);
    }
  }

  return orders.map((order) => ({
    id: `#${order.order_number}`,
    client: order.customer_name,
    equipment: firstItem.get(order.id) ?? "—",
    date: new Date(order.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: mapDashStatus(order.status),
  }));
}

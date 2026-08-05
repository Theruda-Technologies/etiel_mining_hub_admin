import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/features/auth/lib/server";
import type { OrderDetail, OrderStatus, OrderTimelineEvent } from "../data/orders";
import {
  UI_TO_DB,
  allowedNextStatuses,
  mapDbStatus,
} from "../data/orders";

function formatEventDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleForStatus(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "Order Placed";
    case "confirmed":
      return "Order Confirmed";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "cancelled":
      return "Order Cancelled";
    default:
      return status;
  }
}

async function findOrderRow(id: string) {
  const supabase = await createAuthClient();
  const admin = createAdminClient();
  const raw = id.replace(/^#/, "");
  const normalized = raw.toUpperCase();

  const byNumber = await supabase
    .from("orders")
    .select("id, status, created_at, order_number")
    .eq("order_number", normalized)
    .maybeSingle();
  if (byNumber.data) return byNumber.data;

  const byUuid = await supabase
    .from("orders")
    .select("id, status, created_at, order_number")
    .eq("id", raw)
    .maybeSingle();
  if (byUuid.data) return byUuid.data;

  const adminByNumber = await admin
    .from("orders")
    .select("id, status, created_at, order_number")
    .eq("order_number", normalized)
    .maybeSingle();
  if (adminByNumber.data) return adminByNumber.data;

  const adminByUuid = await admin
    .from("orders")
    .select("id, status, created_at, order_number")
    .eq("id", raw)
    .maybeSingle();
  return adminByUuid.data;
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
      status: mapDbStatus(order.status),
      buyer: {
        fullName: order.customer_name,
        company,
      },
    };
  });
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const raw = id.replace(/^#/, "");
  const normalized = raw.toUpperCase();
  const supabase = await createAuthClient();
  const admin = createAdminClient();

  const select = `
    id,
    order_number,
    status,
    notes,
    internal_notes,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    created_at,
    updated_at,
    order_items (
      id,
      item_type,
      quantity,
      name_snapshot,
      sku_snapshot,
      product_id,
      service_id,
      products ( description, image_paths ),
      services ( description, image_paths )
    )
  `;

  let { data: order } = await supabase
    .from("orders")
    .select(select)
    .eq("order_number", normalized)
    .maybeSingle();

  if (!order) {
    const byUuid = await supabase
      .from("orders")
      .select(select)
      .eq("id", raw)
      .maybeSingle();
    order = byUuid.data;
  }

  if (!order) {
    const adminResult = await admin
      .from("orders")
      .select(select)
      .eq("order_number", normalized)
      .maybeSingle();
    order = adminResult.data;
    if (!order) {
      const byUuid = await admin
        .from("orders")
        .select(select)
        .eq("id", raw)
        .maybeSingle();
      order = byUuid.data;
    }
  }

  if (!order) return null;

  const status = mapDbStatus(order.status);
  const rawItems = (order.order_items ?? []) as Array<Record<string, unknown>>;
  const items = rawItems.map((item) => {
    const itemType = String(item.item_type ?? "product");
    const related = itemType === "service" ? item.services : item.products;
    const catalog = Array.isArray(related)
      ? (related[0] as
          | { description?: string; image_paths?: string[] }
          | undefined)
      : (related as { description?: string; image_paths?: string[] } | null);

    const image =
      Array.isArray(catalog?.image_paths) && catalog.image_paths[0]
        ? catalog.image_paths[0]
        : "";

    return {
      id: String(item.id),
      name: String(item.name_snapshot ?? ""),
      description: catalog?.description?.trim() || "",
      sku: String(item.sku_snapshot ?? ""),
      qty: Number(item.quantity ?? 0),
      image,
    };
  });

  const address = String(order.shipping_address ?? "")
    .split(/\n|,/)
    .map((line: string) => line.trim())
    .filter(Boolean);

  const { data: history } = await supabase
    .from("order_status_history")
    .select("id, from_status, to_status, note, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  let historyRows = history;
  if (!historyRows) {
    const adminHistory = await admin
      .from("order_status_history")
      .select("id, from_status, to_status, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    historyRows = adminHistory.data;
  }

  const timeline: OrderTimelineEvent[] = (historyRows ?? []).map(
    (event, index, arr) => ({
      id: event.id,
      title: titleForStatus(event.to_status),
      date: formatEventDate(event.created_at),
      description:
        event.note?.trim() ||
        (event.from_status
          ? `Status changed from ${event.from_status} to ${event.to_status}.`
          : "Order created."),
      active: index === arr.length - 1,
    }),
  );

  return {
    id: order.order_number,
    uuid: order.id,
    status,
    allowedNextStatuses: allowedNextStatuses(order.status),
    items,
    buyer: {
      fullName: order.customer_name,
      company: address[0] ?? "—",
      email: order.customer_email,
      phone: order.customer_phone,
      shippingAddress: address.length ? address : [order.shipping_address],
    },
    notes: order.notes ?? "",
    internalNotes: order.internal_notes ?? "",
    timeline,
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  internalNotes: string,
) {
  const supabase = await createAuthClient();
  const existing = await findOrderRow(id);

  if (!existing) {
    return { error: { message: "Order not found." } };
  }

  const current = mapDbStatus(existing.status);
  const nextDb = UI_TO_DB[status];

  if (current !== status) {
    const { error: rpcError } = await supabase.rpc("update_order_status", {
      p_order_id: existing.id,
      p_new_status: nextDb,
      p_note: internalNotes.trim() || `Status updated to ${nextDb}`,
    });

    if (rpcError) {
      return { error: { message: rpcError.message } };
    }
  }

  const { error: notesError } = await supabase
    .from("orders")
    .update({
      internal_notes: internalNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (notesError) {
    return { error: { message: notesError.message } };
  }

  return { error: null };
}

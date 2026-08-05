import { listOrders } from "@/features/orders";
import { OrdersPageClient } from "@/features/orders/components/orders-page-client";

export default async function OrdersPage() {
  const list = await listOrders();
  return <OrdersPageClient orders={list} />;
}

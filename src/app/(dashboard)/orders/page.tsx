import { listOrders } from "@/features/orders";
import { OrdersTable } from "@/features/orders/components/orders-table";

export default async function OrdersPage() {
  const list = await listOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[28px] font-semibold tracking-tight">Orders</h2>
        <p className="mt-1 text-[14px] text-muted">
          Manage mining equipment and logistics orders.
        </p>
      </div>

      <OrdersTable orders={list} />
    </div>
  );
}
